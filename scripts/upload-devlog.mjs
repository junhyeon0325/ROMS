import fs from 'fs';
import path from 'path';
import { Client } from '@notionhq/client';
import { markdownToBlocks } from '@tryfabric/martian';

// 1. 환경 변수 로드 (.env 및 .env.local 지원)
if (fs.existsSync('.env.local')) {
  try { process.loadEnvFile('.env.local'); } catch (_) {}
}
if (fs.existsSync('.env')) {
  try { process.loadEnvFile('.env'); } catch (_) {}
}

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_PAGE_ID = process.env.NOTION_PAGE_ID || process.env.NOTION_DATABASE_ID;

if (!NOTION_API_KEY) {
  console.error('\n❌ [오류] NOTION_API_KEY가 설정되지 않았습니다.');
  console.error('.env 파일에 NOTION_API_KEY="secret_..." 형태로 입력해 주세요.\n');
  process.exit(1);
}

if (!NOTION_PAGE_ID) {
  console.error('\n❌ [오류] NOTION_PAGE_ID (또는 NOTION_DATABASE_ID)가 설정되지 않았습니다.');
  console.error('.env 파일에 NOTION_PAGE_ID="페이지ID 또는 노션 URL" 형태로 입력해 주세요.\n');
  process.exit(1);
}

// URL이나 UUID에서 32자리 ID 자동 추출
function extractNotionId(rawId) {
  if (!rawId) return '';
  const trimmed = rawId.trim();
  const match = trimmed.match(/[a-f0-9]{32}/i);
  if (match) return match[0];
  const uuidMatch = trimmed.match(/[a-f0-9]{8}-?[a-f0-9]{4}-?[a-f0-9]{4}-?[a-f0-9]{4}-?[a-f0-9]{12}/i);
  if (uuidMatch) return uuidMatch[0].replace(/-/g, '');
  return trimmed.replace(/-/g, '');
}

const targetParentId = extractNotionId(NOTION_PAGE_ID);
const notion = new Client({ auth: NOTION_API_KEY, logLevel: 'error' });

const devlogDir = path.resolve(process.cwd(), '산출물', '개발일지');
if (!fs.existsSync(devlogDir)) {
  console.error(`\n❌ [오류] 개발일지 폴더(${devlogDir})를 찾을 수 없습니다.\n`);
  process.exit(1);
}

const args = process.argv.slice(2);
const isAll = args.includes('--all') || args.includes('-a');
const isForce = args.includes('--force') || args.includes('-f');
const specificTarget = args.find(a => !a.startsWith('-'));

// 유효하지 않은 URL 링크 안전 제거 (http://, https:// 외 링크는 일반 텍스트로 처리)
function sanitizeBlocks(items) {
  for (const block of items) {
    const type = block.type;
    if (type && block[type] && Array.isArray(block[type].rich_text)) {
      for (const rt of block[type].rich_text) {
        if (rt.text && rt.text.link && rt.text.link.url) {
          const url = rt.text.link.url;
          if (!url.startsWith('http://') && !url.startsWith('https://')) {
            rt.text.link = null;
          }
        }
        if (rt.href && !rt.href.startsWith('http://') && !rt.href.startsWith('https://')) {
          rt.href = null;
        }
      }
    }
    const children = (block[type] && Array.isArray(block[type].children))
      ? block[type].children
      : (Array.isArray(block.children) ? block.children : null);

    if (children) {
      sanitizeBlocks(children);
    }
  }
}

// 노션 API의 최대 중첩 제한(2단계 초과 금지)을 초과하는 깊은 자식 블록 평탄화(Flatten)
function flattenDeepBlocks(blockList, depth = 0, maxDepth = 2) {
  const result = [];
  for (const block of blockList) {
    const copy = { ...block };
    const type = copy.type;
    const inner = type && copy[type] ? copy[type] : null;

    let childList = null;
    let isInner = false;

    if (inner && Array.isArray(inner.children) && inner.children.length > 0) {
      childList = inner.children;
      isInner = true;
    } else if (Array.isArray(copy.children) && copy.children.length > 0) {
      childList = copy.children;
      isInner = false;
    }

    if (childList) {
      if (depth >= maxDepth) {
        if (isInner) {
          delete inner.children;
        } else {
          delete copy.children;
        }
        result.push(copy);
        const flattened = flattenDeepBlocks(childList, depth, maxDepth);
        result.push(...flattened);
      } else {
        const processedChildren = flattenDeepBlocks(childList, depth + 1, maxDepth);
        if (isInner) {
          inner.children = processedChildren;
        } else {
          copy.children = processedChildren;
        }
        result.push(copy);
      }
    } else {
      result.push(copy);
    }
  }
  return result;
}

// 기존 페이지 블록 내용 최신화(동기화) 함수
async function updateExistingPageBlocks(pageId, pageTitle, blocks) {
  console.log(`🔄 [기존 페이지 최신화] "${pageTitle}" 블록을 동기화합니다...`);

  let existingBlockIds = [];
  let cursor = undefined;
  do {
    const list = await notion.blocks.children.list({ block_id: pageId, start_cursor: cursor, page_size: 100 });
    for (const b of list.results) {
      existingBlockIds.push(b.id);
    }
    cursor = list.has_more ? list.next_cursor : undefined;
  } while (cursor);

  for (const bid of existingBlockIds) {
    try {
      await notion.blocks.delete({ block_id: bid });
    } catch (_) {}
  }

  const CHUNK_SIZE = 100;
  for (let i = 0; i < blocks.length; i += CHUNK_SIZE) {
    await notion.blocks.children.append({
      block_id: pageId,
      children: blocks.slice(i, i + CHUNK_SIZE)
    });
  }

  const pageUrl = `https://notion.so/${pageId.replace(/-/g, '')}`;
  console.log(`✅ [최신화 완료] ${pageTitle}`);
  console.log(`   🔗 ${pageUrl}`);
  return { updated: true, pageTitle, url: pageUrl };
}

// 단일 파일 업로드 함수
async function uploadSingleFile(fileName, parentConfig, titlePropertyKey, hasDevCategory, existingPages = new Map()) {
  const filePath = path.join(devlogDir, fileName);
  let fileContent = fs.readFileSync(filePath, 'utf-8');

  // 1. 노션 미지원 로컬 링크(file:///)를 인라인 코드 `파일명`으로 전처리
  fileContent = fileContent.replace(/\[([^\]]+)\]\(file:\/\/\/[^)]+\)/g, '`$1`');

  // 2. 제목 추출
  let pageTitle = fileName.replace(/\.md$/, '');
  let bodyContent = fileContent;

  const firstLineMatch = fileContent.match(/^#\s+(.+)$/m);
  if (firstLineMatch) {
    pageTitle = firstLineMatch[1].trim();
    bodyContent = fileContent.replace(/^#\s+.+$/m, '').trim();
  }

  // 3. 마크다운을 노션 블록으로 변환 및 정제 (링크 소독, 깊은 중첩 평탄화)
  let blocks = [];
  try {
    blocks = markdownToBlocks(bodyContent);
    sanitizeBlocks(blocks);
    blocks = flattenDeepBlocks(blocks, 0, 2);
  } catch (err) {
    console.error(`❌ [${fileName}] 마크다운 파싱 실패:`, err.message);
    return { failed: true, error: err.message };
  }

  // 중복 체크 및 마스터 인덱스/강제 최신화 처리
  if (existingPages.has(pageTitle)) {
    const existingPage = existingPages.get(pageTitle);
    const isMasterIndex = fileName === 'ROMS_개발일지.md';

    if (isMasterIndex || isForce) {
      return await updateExistingPageBlocks(existingPage.id, pageTitle, blocks);
    } else {
      console.log(`⏩ [이미 등록됨] "${pageTitle}" 건너뜁니다.`);
      return { skipped: true, pageTitle, url: existingPage.url };
    }
  }

  // 100개 단위 분할
  const CHUNK_SIZE = 100;
  const blockChunks = [];
  for (let i = 0; i < blocks.length; i += CHUNK_SIZE) {
    blockChunks.push(blocks.slice(i, i + CHUNK_SIZE));
  }

  const initialChildren = blockChunks.length > 0 ? blockChunks[0] : [];
  const propertiesConfig = {
    [titlePropertyKey]: {
      title: [{ type: 'text', text: { content: pageTitle } }]
    }
  };

  if (hasDevCategory) {
    propertiesConfig['카테고리'] = {
      select: { name: '개발' }
    };
  }

  console.log(`🚀 업로드 시작: "${pageTitle}" (블록 ${blocks.length}개)...`);

  const createdPage = await notion.pages.create({
    parent: parentConfig,
    icon: {
      type: 'emoji',
      emoji: '📝'
    },
    properties: propertiesConfig,
    children: initialChildren
  });

  if (blockChunks.length > 1) {
    for (let i = 1; i < blockChunks.length; i++) {
      await notion.blocks.children.append({
        block_id: createdPage.id,
        children: blockChunks[i]
      });
    }
  }

  const pageUrl = createdPage.url || `https://notion.so/${createdPage.id.replace(/-/g, '')}`;
  console.log(`✅ [신규 등록 완료] ${pageTitle}`);
  console.log(`   🔗 ${pageUrl}`);
  
  existingPages.set(pageTitle, { id: createdPage.id, url: pageUrl });
  return { success: true, pageTitle, url: pageUrl };
}

async function main() {
  console.log(`🔍 노션 대상 확인 중... (ID: ${targetParentId})`);

  let parentConfig = null;
  let titlePropertyKey = 'title';
  let hasDevCategory = false;
  let existingPages = new Map();

  let isPage = false;
  try {
    const page = await notion.pages.retrieve({ page_id: targetParentId });
    if (page && page.object === 'page') {
      parentConfig = { page_id: page.id };
      isPage = true;
      console.log(`✅ 노션 '페이지' 확인 완료 (ID: ${page.id})`);
    }
  } catch (_) {}

  if (!isPage) {
    try {
      const db = await notion.databases.retrieve({ database_id: targetParentId });
      parentConfig = { database_id: db.id };

      let propertiesSchema = db.properties || {};
      let dataSourceId = db.data_sources?.[0]?.id;

      if (!db.properties && dataSourceId && notion.dataSources) {
        try {
          const ds = await notion.dataSources.retrieve({ data_source_id: dataSourceId });
          if (ds && ds.properties) {
            propertiesSchema = ds.properties;
          }
        } catch (_) {}
      }

      titlePropertyKey = Object.keys(propertiesSchema).find(k => propertiesSchema[k].type === 'title') || 'title';
      if (propertiesSchema['카테고리']?.type === 'select') {
        hasDevCategory = propertiesSchema['카테고리'].select?.options?.some(o => o.name === '개발');
      }

      console.log(`✅ 노션 '데이터베이스' 확인 완료 (제목 필드: "${titlePropertyKey}")`);

      let cursor = undefined;
      do {
        let results = [];
        if (dataSourceId && notion.dataSources) {
          try {
            const res = await notion.dataSources.query({ data_source_id: dataSourceId, start_cursor: cursor, page_size: 100 });
            results = res.results;
            cursor = res.has_more ? res.next_cursor : undefined;
          } catch (_) {}
        }
        if (results.length === 0) {
          try {
            const res = await notion.databases.query({ database_id: targetParentId, start_cursor: cursor, page_size: 100 });
            results = res.results;
            cursor = res.has_more ? res.next_cursor : undefined;
          } catch (_) {}
        }

        for (const item of results) {
          const titleObj = item.properties[titlePropertyKey];
          const titleText = titleObj?.title?.map(t => t.plain_text).join('').trim();
          if (titleText) {
            existingPages.set(titleText, { id: item.id, url: item.url });
          }
        }
      } while (cursor);

      console.log(`📋 노션 DB 기존 등록 항목: ${existingPages.size}건 확인`);
    } catch (err) {
      console.error('\n❌ [권한 또는 ID 오류] 노션 대상(페이지/데이터베이스)을 찾을 수 없습니다.');
      console.error(err.message);
      process.exit(1);
    }
  }

  let filesToUpload = [];

  if (isAll) {
    const dateFiles = fs.readdirSync(devlogDir)
      .filter(f => f.startsWith('ROMS_개발일지_') && f.endsWith('.md'))
      .sort();

    filesToUpload = [...dateFiles];

    if (fs.existsSync(path.join(devlogDir, 'ROMS_개발일지.md'))) {
      filesToUpload.push('ROMS_개발일지.md');
    }
  } else if (specificTarget) {
    if (fs.existsSync(path.join(devlogDir, specificTarget))) {
      filesToUpload.push(specificTarget);
    } else {
      const matched = fs.readdirSync(devlogDir).find(f => f.includes(specificTarget) && f.endsWith('.md'));
      if (matched) filesToUpload.push(matched);
      else {
        console.error(`\n❌ [오류] "${specificTarget}"에 해당하는 일지 파일을 찾을 수 없습니다.\n`);
        process.exit(1);
      }
    }
  } else {
    // 인자가 없을 경우 전체 파일을 스캔하여 미등록된 일지 및 마스터 인덱스를 자동 처리
    const dateFiles = fs.readdirSync(devlogDir)
      .filter(f => f.startsWith('ROMS_개발일지_') && f.endsWith('.md'))
      .sort();

    filesToUpload = [...dateFiles];

    if (fs.existsSync(path.join(devlogDir, 'ROMS_개발일지.md'))) {
      filesToUpload.push('ROMS_개발일지.md');
    }
  }

  console.log(`\n📚 총 ${filesToUpload.length}개 대상 일지 파일 확인:\n${filesToUpload.map(f => ` - ${f}`).join('\n')}\n`);

  let successCount = 0;
  let updatedCount = 0;
  let skipCount = 0;

  for (let i = 0; i < filesToUpload.length; i++) {
    const fileName = filesToUpload[i];
    console.log(`\n[${i + 1}/${filesToUpload.length}] --------------------------------`);
    try {
      const res = await uploadSingleFile(fileName, parentConfig, titlePropertyKey, hasDevCategory, existingPages);
      if (res.skipped) skipCount++;
      else if (res.updated) updatedCount++;
      else if (res.success) successCount++;
      await new Promise(r => setTimeout(r, 500));
    } catch (uploadErr) {
      console.error(`❌ [${fileName}] 업로드 에러:`, uploadErr.message);
    }
  }

  console.log('\n========================================');
  console.log(`🎉 모든 작업 완료! (신규 등록: ${successCount}건, 최신화: ${updatedCount}건, 건너뜀: ${skipCount}건)`);
  console.log('========================================\n');
}

main().catch(err => {
  console.error('\n❌ [오류 발생]', err.message);
  process.exit(1);
});
