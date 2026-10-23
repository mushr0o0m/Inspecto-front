import type { Checklist, Draft } from '../types.ts'
export const exportHeaders = [
  '№',
  'Объект управления (Название дома)',
  'Экземпляр помещения / зона',
  'Состав работ',
  'Периодичность',
  'Примечание',
  'Помещение',
  'Система',
  'Узел',
  'Диапазон погрешности',
  'Необходимость фотоотчета',
  'Необходимость занесения данных в атрибуты',
  'Источник',
]
export function exportRows(checklist: Checklist, draft: Draft) {
  const houses = new Map(draft.houses.map((h) => [h.id, h.address]))
  return checklist.items.map((item, index) => [
    index + 1,
    houses.get(item.houseId) ?? '',
    item.zone,
    item.task,
    item.frequency,
    item.note,
    item.room ?? item.zone,
    item.system ?? '',
    item.unit ?? '',
    item.tolerance ?? 'Больше или меньше этого значения - это отклонение',
    item.photo ?? 'Нет',
    item.attributes ?? 'Нет',
    item.source ?? '',
  ])
}
