import { createCn } from 'cn/config'

// Told about our named sizes, or it reads `text-caption` as a colour and a real colour beside it removes it
export const cn = createCn({
  extend: { classGroups: { 'font-size': [{ text: ['caption', 'row'] }] } },
})
