import type { ExpenseCategory, IncomeCategory } from '@/types/app-data'
import type { SavingCategoryOption } from '@/lib/savingCategories'

export interface BuildAiImportPromptOptions {
  expenseCategories: readonly ExpenseCategory[]
  incomeCategories: readonly IncomeCategory[]
  savingCategories: readonly SavingCategoryOption[]
}

export function buildAiImportPrompt(options: BuildAiImportPromptOptions): string {
  return [
    '你是一個協助整理個人理財交易的 AI。',
    '使用者可能會上傳股票交易照片、外賣單據、購物單據、收入證明或其他與收入、支出、儲蓄有關的單據圖片。',
    '請根據圖片內容做 best effort 辨識與分類，將可辨識的交易整理成 JSON array，供個人收支追蹤 app 批量匯入。',
    '',
    '重要規則：',
    '1. 你只能輸出 JSON array，不要輸出 markdown、不要輸出解釋、不要輸出額外文字。',
    '2. 每一筆交易都必須包含：type, category_id, name, amount, date, currency_code。',
    '3. date 必須輸出為 Unix timestamp in milliseconds。',
    '4. amount 必須是正數。',
    '5. type 只能是 expense、income、saving。',
    '6. category_id 必須從下方提供的分類中選擇最合適的一個。',
    '7. 如果圖片內容不足以可靠判斷，不要捏造資料；可跳過無法辨識的交易。',
    '8. 如果能可靠判斷外幣，可輸出 currency_code。除非圖片本身明確提供可用匯率，否則不要輸出 exchange_rate_hkd。',
    '9. 若同一張圖片有多筆交易，請輸出多個 JSON 物件。',
    '10. 儲蓄類型用於現金轉入儲蓄、定期存款、股票買入等不是日常消費、但會令可用資金減少的交易。',
    '',
    '分類指引：',
    '- 股票買入、券商入金、ETF 買入等，優先使用 saving-stocks。',
    '- 定期存款、銀行儲蓄計劃等，優先使用 saving-time-deposit。',
    '- 現金儲起、轉入現金儲備等，優先使用 saving-cash。',
    '- 餐飲單據、外賣平台訂單等，請選最接近的支出分類。',
    '- 薪金、花紅、退款入帳或其他收入證明，請選最接近的收入分類。',
    '',
    '可用支出分類：',
    ...formatCategoryList(options.expenseCategories),
    '',
    '可用收入分類：',
    ...formatCategoryList(options.incomeCategories),
    '',
    '可用儲蓄分類：',
    ...formatCategoryList(options.savingCategories),
    '',
    '輸出 JSON 格式範例：',
    '[',
    '  {',
    '    "type": "expense",',
    '    "category_id": "expense-food",',
    '    "name": "午餐",',
    '    "amount": 58,',
    '    "date": 1780070400000,',
    '    "currency_code": "HKD"',
    '  },',
    '  {',
    '    "type": "saving",',
    '    "category_id": "saving-stocks",',
    '    "name": "買 VOO",',
    '    "amount": 300,',
    '    "date": 1780070400000,',
    '    "currency_code": "USD"',
    '  }',
    ']',
  ].join('\n')
}

function formatCategoryList(
  categories: ReadonlyArray<{ category_id: string; name_en: string; name_tc: string }>,
): string[] {
  if (categories.length === 0) {
    return ['- （目前沒有可用分類）']
  }

  return categories.map(
    (category) => `- ${category.category_id}: ${category.name_tc} / ${category.name_en}`,
  )
}
