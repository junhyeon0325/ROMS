// 선수 추가 그리드에서 이미 참가한 스트리머를 제외하고 다중 선택 상태를 관리한다.

// 행 선택 시 등록된 스트리머를 건너뛰고 같은 ID는 한 번만 유지한다.
export function toggleSelectedStreamer(selectedIds: string[], streamerId: string, registeredIds: ReadonlySet<string>) {
  if (registeredIds.has(streamerId)) return selectedIds;
  return selectedIds.includes(streamerId) ? selectedIds.filter((id) => id !== streamerId) : [...selectedIds, streamerId];
}

// 현재 검색 결과의 미등록 스트리머만 전체 선택하거나 해제한다.
export function toggleVisibleStreamers(selectedIds: string[], visibleIds: string[], registeredIds: ReadonlySet<string>) {
  const eligible = [...new Set(visibleIds.filter((id) => !registeredIds.has(id)))];
  if (!eligible.length) return selectedIds;
  const allSelected = eligible.every((id) => selectedIds.includes(id));
  return allSelected ? selectedIds.filter((id) => !eligible.includes(id)) : [...new Set([...selectedIds, ...eligible])];
}
