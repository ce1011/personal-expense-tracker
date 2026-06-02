export interface SavingCategoryOption {
  category_id: string
  name_en: string
  name_tc: string
  color_code: string
  icon_image_name: string
}

export const savingCategories: SavingCategoryOption[] = [
  {
    category_id: 'saving-cash',
    name_en: 'Cash',
    name_tc: '現金',
    color_code: '2f6f66',
    icon_image_name: 'wallet',
  },
  {
    category_id: 'saving-time-deposit',
    name_en: 'Time Deposit',
    name_tc: '定期存款',
    color_code: '496b91',
    icon_image_name: 'landmark',
  },
  {
    category_id: 'saving-stocks',
    name_en: 'Stocks',
    name_tc: '股票',
    color_code: '7b6d3d',
    icon_image_name: 'chart-column',
  },
]

export const savingCategoryMap = new Map(
  savingCategories.map((category) => [category.category_id, category] as const),
)
