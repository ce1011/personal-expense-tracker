<script setup lang="ts">
import { computed, reactive, shallowRef, watch } from 'vue'
import {
  Banknote,
  Briefcase,
  Bus,
  Car,
  ChartPie,
  Coffee,
  Film,
  Gift,
  Home,
  Plane,
  ShoppingBag,
  Smartphone,
  Tag,
  Train,
  Trash2,
  TrendingUp,
  Utensils,
  Wallet,
  Zap,
} from 'lucide-vue-next'
import type { Component } from 'vue'

import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import SkeletonCard from '@/components/base/SkeletonCard.vue'
import SkeletonList from '@/components/base/SkeletonList.vue'
import { useAppData } from '@/composables/useAppData'
import { withHash } from '@/lib/formatters'
import type { CategoryDraft } from '@/types/app-data'

type CategoryType = 'expense' | 'income'

const appData = useAppData()
const activeTab = shallowRef<CategoryType>('expense')

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

const form = computed(() => (activeTab.value === 'expense' ? expenseForm : incomeForm))
const categories = computed(() =>
  activeTab.value === 'expense'
    ? appData.activeExpenseCategories.value
    : appData.activeIncomeCategories.value,
)

const colorPalette = [
  '2f6f66',
  '0d7a68',
  '496b91',
  '2563eb',
  '7c3aed',
  'db2777',
  'b5392a',
  'dc2626',
  'd97706',
  'ca8a04',
  '65a30d',
  '16a34a',
  '0891b2',
  '52525b',
  '78716c',
]

const iconMap: Record<string, Component> = {
  tag: Tag,
  utensils: Utensils,
  train: Train,
  bus: Bus,
  car: Car,
  'shopping-bag': ShoppingBag,
  coffee: Coffee,
  film: Film,
  home: Home,
  smartphone: Smartphone,
  plane: Plane,
  briefcase: Briefcase,
  gift: Gift,
  wallet: Wallet,
  'trending-up': TrendingUp,
  'chart-pie': ChartPie,
  banknote: Banknote,
  zap: Zap,
}

const iconNames = Object.keys(iconMap)
const previewIcon = shallowRef<Component | null>(null)

watch(
  () => form.value.icon_image_name,
  (name) => {
    previewIcon.value = iconMap[name] ?? null
  },
  { immediate: true },
)

function reset(formToReset: CategoryDraft, color: string, icon: string): void {
  formToReset.name_en = ''
  formToReset.name_tc = ''
  formToReset.color_code = color
  formToReset.icon_image_name = icon
}

function submit(): void {
  if (!form.value.name_en.trim()) {
    return
  }

  const save =
    activeTab.value === 'expense' ? appData.saveExpenseCategory : appData.saveIncomeCategory

  void save({ ...form.value }).then(() =>
    reset(
      form.value,
      activeTab.value === 'expense' ? '2f6f66' : '496b91',
      activeTab.value === 'expense' ? 'tag' : 'wallet',
    ),
  )
}

function deleteCategory(categoryId: string): void {
  if (activeTab.value === 'expense') {
    void appData.deleteExpenseCategory(categoryId)
  } else {
    void appData.deleteIncomeCategory(categoryId)
  }
}
</script>

<template>
  <div class="grid gap-4">
    <header>
      <p class="text-xs font-semibold uppercase tracking-[0.16em] text-primary">設定</p>
      <h1 class="mt-1 text-h1 font-bold text-text">分類管理</h1>
      <p class="mt-1 text-body-sm text-text-2">新增與管理支出、收入分類，包含顏色與圖示預覽。</p>
    </header>

    <div class="inline-flex rounded-xl border border-border bg-accent p-1">
      <button
        type="button"
        class="min-h-11 flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition"
        :class="
          activeTab === 'expense' ? 'bg-surface text-text shadow-sm' : 'text-text-2 hover:text-text'
        "
        @click="activeTab = 'expense'"
      >
        支出
      </button>
      <button
        type="button"
        class="min-h-11 flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition"
        :class="
          activeTab === 'income' ? 'bg-surface text-text shadow-sm' : 'text-text-2 hover:text-text'
        "
        @click="activeTab = 'income'"
      >
        收入
      </button>
    </div>

    <div v-if="appData.loading.value" class="grid gap-4">
      <SkeletonCard :lines="5" />
      <SkeletonList :rows="4" />
    </div>

    <template v-else>
      <BaseCard>
        <h2 class="text-h3 font-semibold text-text">
          新增{{ activeTab === 'expense' ? '支出' : '收入' }}分類
        </h2>

        <form class="mt-4 grid gap-4" @submit.prevent="submit">
          <div class="grid gap-3 sm:grid-cols-2">
            <BaseInput
              v-model.trim="form.name_en"
              label="英文名稱"
              placeholder="例如：lunch"
              autocomplete="off"
            />
            <BaseInput
              v-model.trim="form.name_tc"
              label="繁中名稱"
              placeholder="例如：午餐"
              autocomplete="off"
            />
          </div>

          <div>
            <label class="mb-1.5 block text-sm font-medium text-text-2">顏色</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="color in colorPalette"
                :key="color"
                type="button"
                class="size-10 rounded-full border-2 transition"
                :class="form.color_code === color ? 'border-text' : 'border-transparent'"
                :style="{ backgroundColor: withHash(color) }"
                :aria-label="`選擇顏色 ${color}`"
                @click="form.color_code = color"
              />
            </div>
          </div>

          <div>
            <label class="mb-1.5 block text-sm font-medium text-text-2">圖示</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="name in iconNames"
                :key="name"
                type="button"
                class="inline-flex size-11 items-center justify-center rounded-xl border transition"
                :class="
                  form.icon_image_name === name
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border bg-surface text-text-2 hover:border-primary/50'
                "
                :aria-label="`選擇圖示 ${name}`"
                @click="form.icon_image_name = name"
              >
                <component :is="iconMap[name]" class="size-5" aria-hidden="true" />
              </button>
            </div>
            <BaseInput
              v-model.trim="form.icon_image_name"
              class="mt-3"
              label="或輸入 lucide 圖示名稱"
              placeholder="例如：utensils"
              autocomplete="off"
            />
            <div class="mt-2 flex items-center gap-2 text-body-sm text-text-2">
              <span>預覽：</span>
              <component
                :is="previewIcon"
                v-if="previewIcon"
                class="size-6"
                :style="{ color: withHash(form.color_code) }"
                aria-hidden="true"
              />
              <span v-else class="text-text-3">無法載入圖示「{{ form.icon_image_name }}」</span>
            </div>
          </div>

          <BaseButton type="submit" class="w-full sm:w-auto">
            新增{{ activeTab === 'expense' ? '支出' : '收入' }}分類
          </BaseButton>
        </form>
      </BaseCard>

      <BaseCard>
        <h2 class="text-h3 font-semibold text-text">
          現有{{ activeTab === 'expense' ? '支出' : '收入' }}分類
        </h2>

        <div v-if="categories.length" class="mt-4 grid gap-2">
          <div
            v-for="category in categories"
            :key="category.category_id"
            class="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface p-3"
          >
            <div class="flex items-center gap-3">
              <span
                class="size-3 rounded-full"
                :style="{ backgroundColor: withHash(category.color_code) }"
              />
              <div>
                <p class="text-body-sm font-semibold text-text">
                  {{ category.name_tc || category.name_en }}
                </p>
                <p class="text-caption text-text-2">
                  {{ category.name_en }} · {{ category.icon_image_name }}
                </p>
              </div>
            </div>
            <BaseButton
              variant="danger"
              aria-label="停用分類"
              @click="deleteCategory(category.category_id)"
            >
              <Trash2 class="size-4" aria-hidden="true" />
              停用
            </BaseButton>
          </div>
        </div>

        <p v-else class="mt-4 text-body-sm text-text-2">目前沒有自訂分類。</p>
      </BaseCard>
    </template>
  </div>
</template>
