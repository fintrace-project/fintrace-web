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

// The categories from below the branch's root down to this one, the top level first; empty for a root
export function lineage(categories: Category[], id: string): Category[] {
  const byId = new Map(categories.map((each) => [each.id, each]))
  const chain: Category[] = []
  let category = byId.get(id)
  while (category?.parentId) {
    chain.unshift(category)
    category = byId.get(category.parentId)
  }
  return chain
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
  const recent = [...new Set(recentIds.map((id) => lineage(categories, id)[0]?.id))]
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

export interface CategorySearch {
  top: Category[]
  below: { parentId: string; path: string[]; matches: Category[] }[]
}

// Keeps the tree's shape: top-level matches apart, deeper ones in a group per parent
export function searchCategories(categories: Category[], kind: CategoryKind, query: string): CategorySearch {
  const wanted = query.trim().toLocaleLowerCase()
  const found = wanted
    ? categoryOptions(categories, kind)
        .map(({ category }) => ({ category, path: categoryPath(categories, category.id) }))
        .filter(({ path }) => path.join(' ').toLocaleLowerCase().includes(wanted))
    : []
  const top = found.filter(({ path }) => path.length === 1).map(({ category }) => category)
  const below = new Map<string, CategorySearch['below'][number]>()
  for (const { category, path } of found) {
    if (path.length > 1 && category.parentId) {
      const group = below.get(category.parentId) ?? {
        parentId: category.parentId,
        path: path.slice(0, -1),
        matches: [],
      }
      group.matches.push(category)
      below.set(category.parentId, group)
    }
  }
  return { top, below: [...below.values()] }
}

// Where a category can move: its own branch's root and any category there, except itself, what lies
// below it, and Others, which stays a leaf (§4.7)
export function moveTargets(categories: Category[], moving: Category): CategoryOption[] {
  const root = rootOf(categories, moving.kind)
  if (!root) {
    return []
  }
  const below = categoryOptions(categories, moving.kind)
    .filter(({ category }) => !isOthers(category))
    .filter(({ category }) => !lineage(categories, category.id).some((each) => each.id === moving.id))
    .map(({ category, depth }) => ({ category, depth: depth + 1 }))
  return [{ category: root, depth: 0 }, ...below]
}

export const rootOf = (categories: Category[], kind: CategoryKind) =>
  categories.find((each) => each.systemCode === `${kind}_ROOT`)

// The names from below the branch's root down to the category: ["Food and drink", "Cafes"]
export const categoryPath = (categories: Category[], id: string) =>
  lineage(categories, id).map((category) => category.name)
