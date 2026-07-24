<script setup lang="ts">
import type { DateValue } from '@internationalized/date'
import { parseDate } from '@internationalized/date'
import {
  DatePickerCalendar,
  DatePickerCell,
  DatePickerCellTrigger,
  DatePickerContent,
  DatePickerField,
  DatePickerGrid,
  DatePickerGridBody,
  DatePickerGridHead,
  DatePickerGridRow,
  DatePickerHeadCell,
  DatePickerHeader,
  DatePickerHeading,
  DatePickerInput,
  DatePickerNext,
  DatePickerPrev,
  DatePickerRoot,
  DatePickerTrigger,
} from 'reka-ui'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { computed, useId } from 'vue'

import UiLabel from '@/components/ui/UiLabel.vue'

const props = defineProps<{
  modelValue: string
  label?: string
  error?: string
  id?: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const fieldId = props.id ?? useId()

const dateValue = computed<DateValue | undefined>({
  get() {
    if (!props.modelValue) {
      return undefined
    }

    try {
      return parseDate(props.modelValue)
    } catch {
      return undefined
    }
  },
  set(value) {
    emit('update:modelValue', value ? value.toString() : '')
  },
})
</script>

<template>
  <div class="w-full">
    <UiLabel v-if="label" :for="fieldId">{{ label }}</UiLabel>
    <DatePickerRoot
      v-model="dateValue"
      :id="fieldId"
      :disabled="disabled"
      locale="zh-HK"
      class="w-full"
    >
      <DatePickerField
        v-slot="{ segments }"
        class="input-base flex items-center gap-1"
        :class="error ? 'input-base-error' : ''"
      >
        <template v-for="item in segments" :key="item.part">
          <DatePickerInput
            v-if="item.part === 'literal'"
            :part="item.part"
            class="px-0.5 text-text-3"
          >
            {{ item.value }}
          </DatePickerInput>
          <DatePickerInput
            v-else
            :part="item.part"
            class="rounded px-0.5 tabular-nums outline-none focus:bg-accent focus:text-text data-[placeholder]:text-text-3"
          >
            {{ item.value }}
          </DatePickerInput>
        </template>
        <DatePickerTrigger
          class="ml-auto inline-flex size-8 items-center justify-center rounded-lg text-text-2 transition hover:bg-accent"
          aria-label="開啟日曆"
        >
          <CalendarIcon class="size-4" aria-hidden="true" />
        </DatePickerTrigger>
      </DatePickerField>

      <DatePickerContent
        :side-offset="8"
        class="z-[90] rounded-2xl border border-border bg-surface p-3 shadow-xl outline-none"
      >
        <DatePickerCalendar v-slot="{ weekDays, grid }">
          <DatePickerHeader class="flex items-center justify-between gap-2 pb-2">
            <DatePickerPrev
              class="inline-flex size-9 items-center justify-center rounded-full text-text-2 transition hover:bg-accent"
            >
              <ChevronLeft class="size-4" aria-hidden="true" />
            </DatePickerPrev>
            <DatePickerHeading class="text-sm font-semibold text-text" />
            <DatePickerNext
              class="inline-flex size-9 items-center justify-center rounded-full text-text-2 transition hover:bg-accent"
            >
              <ChevronRight class="size-4" aria-hidden="true" />
            </DatePickerNext>
          </DatePickerHeader>

          <div class="flex flex-col gap-4">
            <DatePickerGrid
              v-for="month in grid"
              :key="month.value.toString()"
              class="w-full border-collapse space-y-1"
            >
              <DatePickerGridHead>
                <DatePickerGridRow class="mb-1 flex w-full justify-between">
                  <DatePickerHeadCell
                    v-for="day in weekDays"
                    :key="day"
                    class="w-9 text-center text-[11px] font-semibold text-text-3"
                  >
                    {{ day }}
                  </DatePickerHeadCell>
                </DatePickerGridRow>
              </DatePickerGridHead>
              <DatePickerGridBody>
                <DatePickerGridRow
                  v-for="(weekDates, index) in month.rows"
                  :key="String(index)"
                  class="flex w-full justify-between"
                >
                  <DatePickerCell
                    v-for="weekDate in weekDates"
                    :key="weekDate.toString()"
                    :date="weekDate"
                  >
                    <DatePickerCellTrigger
                      v-slot="{ dayValue }"
                      :day="weekDate"
                      :month="month.value"
                      class="inline-flex size-9 items-center justify-center rounded-full text-sm text-text outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary/30 data-[disabled]:pointer-events-none data-[outside-view]:text-text-3 data-[selected]:bg-primary data-[selected]:text-white data-[disabled]:opacity-40 data-[today]:font-bold data-[today]:text-primary data-[selected]:data-[today]:text-white"
                    >
                      {{ dayValue }}
                    </DatePickerCellTrigger>
                  </DatePickerCell>
                </DatePickerGridRow>
              </DatePickerGridBody>
            </DatePickerGrid>
          </div>
        </DatePickerCalendar>
      </DatePickerContent>
    </DatePickerRoot>
    <p v-if="error" class="mt-1.5 text-sm text-danger">{{ error }}</p>
  </div>
</template>
