import type { Category, CategoryKind } from '@/core/api'

export interface CategoryOption {
  category: Category
  // 0 for the root's children
  depth: number
}

const othersCode = { INCOME: 'INCOME_OTHERS', EXPENSE: 'EXPENSE_OTHERS' } as const

export const othersOf = (categories: Category[], kind: CategoryKind) =>
  categories.find((each) => each.systemCode === othersCode[kind])

const isOthers = (category: Category) =>
  category.systemCode === othersCode.INCOME || category.systemCode === othersCode.EXPENSE ? 1 : 0

// Siblings by name, Others last
const readingOrder = (a: Category, b: Category) => isOthers(a) - isOthers(b) || a.name.localeCompare(b.name)

// The ones an operation can still be filed under, in reading order
export const childrenOf = (categories: Category[], parentId: string) =>
  categories.filter((each) => each.parentId === parentId && !each.archived).sort(readingOrder)

// The category directly under its branch's root that this one sits in: itself when it is one
export function topLevelOf(categories: Category[], id: string): Category | undefined {
  const byId = new Map(categories.map((each) => [each.id, each]))
  let category = byId.get(id)
  while (category?.parentId) {
    const parent = byId.get(category.parentId)
    if (!parent?.parentId) {
      return category
    }
    category = parent
  }
  return undefined
}

// The category directly under `ancestorId` on the way down to `id`; undefined when `id` is not below it
export function childOnPath(categories: Category[], ancestorId: string, id: string): Category | undefined {
  const byId = new Map(categories.map((each) => [each.id, each]))
  let category = byId.get(id)
  while (category && category.parentId !== ancestorId) {
    category = category.parentId ? byId.get(category.parentId) : undefined
  }
  return category
}

// The branch's top level, the ones holding the recently used categories first, then the rest in reading order
export function topLevelCategories(
  categories: Category[],
  kind: CategoryKind,
  recentIds: string[],
): Category[] {
  const root = categories.find((each) => each.systemCode === `${kind}_ROOT`)
  if (!root) {
    return []
  }
  const recent = [...new Set(recentIds.map((id) => topLevelOf(categories, id)?.id))]
  const rank = (category: Category) => {
    const at = recent.indexOf(category.id)
    return at < 0 ? recent.length : at
  }
  return childrenOf(categories, root.id).sort((a, b) => rank(a) - rank(b) || readingOrder(a, b))
}

// The categories an operation of this kind can be filed under, as a tree in reading order: siblings by
// name, Others last. The root is the branch itself, not a choice; an archived category takes its subtree
// with it, as nothing new may be filed there.
export function categoryOptions(categories: Category[], kind: CategoryKind): CategoryOption[] {
  const root = categories.find((each) => each.systemCode === `${kind}_ROOT`)
  if (!root) {
    return []
  }
  const options: CategoryOption[] = []
  const visit = (parentId: string, depth: number) => {
    for (const category of childrenOf(categories, parentId)) {
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
