<script setup lang="ts">
import { reactive } from 'vue'
import { Trash2 } from 'lucide-vue-next'

import { useAppData } from '@/composables/useAppData'
import { withHash } from '@/lib/formatters'
import type { CategoryDraft } from '@/types/app-data'

const appData = useAppData()

const expenseForm = reactive<CategoryDraft>({
  name_en: '',
  name_tc: '',
  color_code: '2f6f66',
  icon_image_name: 'tag',
})
const incomeForm = reactive<CategoryDraft>({
  name_en: '',
  name_tc: '',
  color_code: '496b91',
  icon_image_name: 'wallet',
})

function reset(form: CategoryDraft, color: string, icon: string): void {
  form.name_en = ''
  form.name_tc = ''
  form.color_code = color
  form.icon_image_name = icon
}

function submitExpense(): void {
  if (!expenseForm.name_en.trim()) {
    return
  }

  void appData
    .saveExpenseCategory({ ...expenseForm })
    .then(() => reset(expenseForm, '2f6f66', 'tag'))
}

function submitIncome(): void {
  if (!incomeForm.name_en.trim()) {
    return
  }

  void appData
    .saveIncomeCategory({ ...incomeForm })
    .then(() => reset(incomeForm, '496b91', 'wallet'))
}
</script>

<template>
  <div class="grid gap-6">
    <section>
      <p class="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-800">設定</p>
      <h1 class="mt-1 text-3xl font-semibold tracking-tight text-stone-950">分類管理</h1>
    </section>

    <div class="grid gap-6 lg:grid-cols-2">
      <section class="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
        <h2 class="text-lg font-semibold text-stone-950">支出分類</h2>
        <form class="mt-4 grid gap-3 md:grid-cols-2" @submit.prevent="submitExpense">
          <input
            v-model.trim="expenseForm.name_en"
            class="rounded-md border border-stone-300 px-3 py-2"
            placeholder="英文名稱"
          />
          <input
            v-model.trim="expenseForm.name_tc"
            class="rounded-md border border-stone-300 px-3 py-2"
            placeholder="繁中名稱"
          />
          <input
            v-model.trim="expenseForm.color_code"
            class="rounded-md border border-stone-300 px-3 py-2"
            placeholder="顏色代碼"
          />
          <input
            v-model.trim="expenseForm.icon_image_name"
            class="rounded-md border border-stone-300 px-3 py-2"
            placeholder="圖示名稱"
          />
          <button
            class="rounded-md bg-emerald-800 px-4 py-2 text-sm font-semibold text-white md:col-span-2"
            type="submit"
          >
            新增支出分類
          </button>
        </form>

        <div class="mt-4 grid gap-2">
          <div
            v-for="category in appData.activeExpenseCategories.value"
            :key="category.category_id"
            class="flex items-center justify-between rounded-md border border-stone-100 px-3 py-2"
          >
            <div class="flex items-center gap-3">
              <span
                class="size-3 rounded-full"
                :style="{ backgroundColor: withHash(category.color_code) }"
              />
              <div>
                <p class="text-sm font-semibold text-stone-950">
                  {{ category.name_tc || category.name_en }}
                </p>
                <p class="text-xs text-stone-500">
                  {{ category.name_tc }} · {{ category.icon_image_name }}
                </p>
              </div>
            </div>
            <button
              type="button"
              class="rounded-md p-2 text-stone-500 hover:bg-stone-100"
              title="停用分類"
              @click="appData.deleteExpenseCategory(category.category_id)"
            >
              <Trash2 class="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      <section class="rounded-md border border-stone-200 bg-white p-4 shadow-sm">
        <h2 class="text-lg font-semibold text-stone-950">收入分類</h2>
        <form class="mt-4 grid gap-3 md:grid-cols-2" @submit.prevent="submitIncome">
          <input
            v-model.trim="incomeForm.name_en"
            class="rounded-md border border-stone-300 px-3 py-2"
            placeholder="英文名稱"
          />
          <input
            v-model.trim="incomeForm.name_tc"
            class="rounded-md border border-stone-300 px-3 py-2"
            placeholder="繁中名稱"
          />
          <input
            v-model.trim="incomeForm.color_code"
            class="rounded-md border border-stone-300 px-3 py-2"
            placeholder="顏色代碼"
          />
          <input
            v-model.trim="incomeForm.icon_image_name"
            class="rounded-md border border-stone-300 px-3 py-2"
            placeholder="圖示名稱"
          />
          <button
            class="rounded-md bg-stone-900 px-4 py-2 text-sm font-semibold text-white md:col-span-2"
            type="submit"
          >
            新增收入分類
          </button>
        </form>

        <div class="mt-4 grid gap-2">
          <div
            v-for="category in appData.activeIncomeCategories.value"
            :key="category.category_id"
            class="flex items-center justify-between rounded-md border border-stone-100 px-3 py-2"
          >
            <div class="flex items-center gap-3">
              <span
                class="size-3 rounded-full"
                :style="{ backgroundColor: withHash(category.color_code) }"
              />
              <div>
                <p class="text-sm font-semibold text-stone-950">
                  {{ category.name_tc || category.name_en }}
                </p>
                <p class="text-xs text-stone-500">
                  {{ category.name_tc }} · {{ category.icon_image_name }}
                </p>
              </div>
            </div>
            <button
              type="button"
              class="rounded-md p-2 text-stone-500 hover:bg-stone-100"
              title="停用分類"
              @click="appData.deleteIncomeCategory(category.category_id)"
            >
              <Trash2 class="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
