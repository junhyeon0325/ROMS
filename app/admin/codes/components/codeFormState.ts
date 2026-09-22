// File: app/admin/codes/components/codeFormState.ts
// Page/Component: 코드 관리 인라인 폼 상태
// Purpose: 코드 그룹과 상세 코드 편집 폼의 초기값·타입을 섹션 컴포넌트에서 분리한다.

export interface GroupAddForm { groupCode: string; groupName: string; remarks: string; sortOrder: number; isUse: boolean; }
export interface GroupEditForm { groupName: string; remarks: string; sortOrder: number; isUse: boolean; }
export interface CodeAddForm { code: string; name: string; sortOrder: number; isUse: boolean; remarks: string; }
export interface CodeEditForm { name: string; sortOrder: number; isUse: boolean; remarks: string; }

export const INITIAL_GROUP_ADD_FORM: GroupAddForm = { groupCode: "", groupName: "", remarks: "", sortOrder: 1, isUse: true };
export const INITIAL_GROUP_EDIT_FORM: GroupEditForm = { groupName: "", remarks: "", sortOrder: 1, isUse: true };
export const INITIAL_CODE_ADD_FORM: CodeAddForm = { code: "", name: "", sortOrder: 1, isUse: true, remarks: "" };
export const INITIAL_CODE_EDIT_FORM: CodeEditForm = { name: "", sortOrder: 1, isUse: true, remarks: "" };
