<script setup lang="ts">
import type { DateValue } from '@internationalized/date'
import { parseDate } from '@internationalized/date'
import {
  DateRangePickerCalendar,
  DateRangePickerCell,
  DateRangePickerCellTrigger,
  DateRangePickerContent,
  DateRangePickerField,
  DateRangePickerGrid,
  DateRangePickerGridBody,
  DateRangePickerGridHead,
  DateRangePickerGridRow,
  DateRangePickerHeadCell,
  DateRangePickerHeader,
  DateRangePickerHeading,
  DateRangePickerInput,
  DateRangePickerNext,
  DateRangePickerPrev,
  DateRangePickerRoot,
  DateRangePickerTrigger,
} from 'reka-ui'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { computed, useId } from 'vue'

import UiLabel from '@/components/ui/UiLabel.vue'

export type DateRangeString = {
  start: string
  end: string
}

const props = defineProps<{
  modelValue: DateRangeString
  label?: string
  error?: string
  id?: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: DateRangeString]
}>()

const fieldId = props.id ?? useId()

function toDateValue(value: string): DateValue | undefined {
  if (!value) {
    return undefined
  }

  try {
    return parseDate(value)
  } catch {
    return undefined
  }
}

const rangeValue = computed({
  get() {
    return {
      start: toDateValue(props.modelValue.start),
      end: toDateValue(props.modelValue.end),
    }
  },
  set(value: { start: DateValue | undefined; end: DateValue | undefined }) {
    emit('update:modelValue', {
      start: value.start ? value.start.toString() : '',
      end: value.end ? value.end.toString() : '',
    })
  },
})
</script>

<template>
  <div class="w-full">
    <UiLabel v-if="label" :for="fieldId">{{ label }}</UiLabel>
    <DateRangePickerRoot
      v-model="rangeValue"
      :id="fieldId"
      :disabled="disabled"
      locale="zh-HK"
      class="w-full"
    >
      <DateRangePickerField
        v-slot="{ segments }"
        class="input-base flex flex-wrap items-center gap-1"
        :class="error ? 'input-base-error' : ''"
      >
        <template v-for="item in segments.start" :key="`start-${item.part}`">
          <DateRangePickerInput
            v-if="item.part === 'literal'"
            type="start"
            :part="item.part"
            class="px-0.5 text-text-3"
          >
            {{ item.value }}
          </DateRangePickerInput>
          <DateRangePickerInput
            v-else
            type="start"
            :part="item.part"
            class="rounded px-0.5 tabular-nums outline-none focus:bg-accent data-[placeholder]:text-text-3"
          >
            {{ item.value }}
          </DateRangePickerInput>
        </template>

        <span class="px-1 text-text-3">–</span>

        <template v-for="item in segments.end" :key="`end-${item.part}`">
          <DateRangePickerInput
            v-if="item.part === 'literal'"
            type="end"
            :part="item.part"
            class="px-0.5 text-text-3"
          >
            {{ item.value }}
          </DateRangePickerInput>
          <DateRangePickerInput
            v-else
            type="end"
            :part="item.part"
            class="rounded px-0.5 tabular-nums outline-none focus:bg-accent data-[placeholder]:text-text-3"
          >
            {{ item.value }}
          </DateRangePickerInput>
        </template>

        <DateRangePickerTrigger
          class="ml-auto inline-flex size-8 items-center justify-center rounded-lg text-text-2 transition hover:bg-accent"
          aria-label="開啟日期範圍"
        >
          <CalendarIcon class="size-4" aria-hidden="true" />
        </DateRangePickerTrigger>
      </DateRangePickerField>

      <DateRangePickerContent
        :side-offset="8"
        class="z-[90] rounded-2xl border border-border bg-surface p-3 shadow-xl outline-none"
      >
        <DateRangePickerCalendar v-slot="{ weekDays, grid }">
          <DateRangePickerHeader class="flex items-center justify-between gap-2 pb-2">
            <DateRangePickerPrev
              class="inline-flex size-9 items-center justify-center rounded-full text-text-2 transition hover:bg-accent"
            >
              <ChevronLeft class="size-4" aria-hidden="true" />
            </DateRangePickerPrev>
            <DateRangePickerHeading class="text-sm font-semibold text-text" />
            <DateRangePickerNext
              class="inline-flex size-9 items-center justify-center rounded-full text-text-2 transition hover:bg-accent"
            >
              <ChevronRight class="size-4" aria-hidden="true" />
            </DateRangePickerNext>
          </DateRangePickerHeader>

          <div class="flex flex-col gap-4">
            <DateRangePickerGrid
              v-for="month in grid"
              :key="month.value.toString()"
              class="w-full border-collapse space-y-1"
            >
              <DateRangePickerGridHead>
                <DateRangePickerGridRow class="mb-1 flex w-full justify-between">
                  <DateRangePickerHeadCell
                    v-for="day in weekDays"
                    :key="day"
                    class="w-9 text-center text-[11px] font-semibold text-text-3"
                  >
                    {{ day }}
                  </DateRangePickerHeadCell>
                </DateRangePickerGridRow>
              </DateRangePickerGridHead>
              <DateRangePickerGridBody>
                <DateRangePickerGridRow
                  v-for="(weekDates, index) in month.rows"
                  :key="String(index)"
                  class="flex w-full justify-between"
                >
                  <DateRangePickerCell
                    v-for="weekDate in weekDates"
                    :key="weekDate.toString()"
                    :date="weekDate"
                  >
                    <DateRangePickerCellTrigger
                      v-slot="{ dayValue }"
                      :day="weekDate"
                      :month="month.value"
                      class="inline-flex size-9 items-center justify-center rounded-full text-sm text-text outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-primary/30 data-[disabled]:pointer-events-none data-[highlighted]:bg-accent data-[outside-view]:text-text-3 data-[selection-end]:bg-primary data-[selection-start]:bg-primary data-[selected]:bg-primary/15 data-[selection-end]:text-white data-[selection-start]:text-white data-[disabled]:opacity-40 data-[today]:font-bold"
                    >
                      {{ dayValue }}
                    </DateRangePickerCellTrigger>
                  </DateRangePickerCell>
                </DateRangePickerGridRow>
              </DateRangePickerGridBody>
            </DateRangePickerGrid>
          </div>
        </DateRangePickerCalendar>
      </DateRangePickerContent>
    </DateRangePickerRoot>
    <p v-if="error" class="mt-1.5 text-sm text-danger">{{ error }}</p>
  </div>
</template>
