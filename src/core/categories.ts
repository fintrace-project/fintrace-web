import type { Category, CategoryKind } from '@/core/api'

export interface CategoryOption {
  category: Category
  // 0 for the root's children
  depth: number
}

const othersCode = { INCOME: 'INCOME_OTHERS', EXPENSE: 'EXPENSE_OTHERS' } as const

export const othersOf = (categories: Category[], kind: CategoryKind) =>
  categories.find((each) => each.systemCode === othersCode[kind])

// The categories an operation of this kind can be filed under, as a tree in reading order: siblings by
// name, Others last. The root is the branch itself, not a choice; an archived category takes its subtree
// with it, as nothing new may be filed there.
export function categoryOptions(categories: Category[], kind: CategoryKind): CategoryOption[] {
  const root = categories.find((each) => each.systemCode === `${kind}_ROOT`)
  if (!root) {
    return []
  }
  const children = new Map<string, Category[]>()
  for (const category of categories) {
    if (category.parentId && !category.archived) {
      children.set(category.parentId, [...(children.get(category.parentId) ?? []), category])
    }
  }
  const lastly = (category: Category) => (category.systemCode === othersCode[kind] ? 1 : 0)

  const options: CategoryOption[] = []
  const visit = (parentId: string, depth: number) => {
    const ordered = [...(children.get(parentId) ?? [])].sort(
      (a, b) => lastly(a) - lastly(b) || a.name.localeCompare(b.name),
    )
    for (const category of ordered) {
      options.push({ category, depth })
      visit(category.id, depth + 1)
    }
  }
  visit(root.id, 0)
  return options
}

// The names from below the branch's root down to the category: ["Food and drink", "Cafes"]
export function categoryPath(categories: Category[], id: string): string[] {
  const byId = new Map(categories.map((each) => [each.id, each]))
  const names: string[] = []
  let category = byId.get(id)
  while (category?.parentId) {
    names.unshift(category.name)
    category = byId.get(category.parentId)
  }
  return names
}
