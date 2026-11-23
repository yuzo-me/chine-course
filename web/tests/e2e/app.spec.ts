import { expect, test } from '@playwright/test'

test('главная: можно перейти по всем 5 разделам нижней навигации', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Китайский · HSK 1' })).toBeVisible()
  const nav = page.getByRole('navigation', { name: 'Основные разделы' })
  await nav.getByRole('link', { name: 'Карточки' }).click()
  await expect(page.getByRole('button', { name: 'Перевернуть' })).toBeVisible()
  await page.getByRole('button', { name: 'Закрыть занятие' }).click()
  for (const [name, heading] of [['Практика', 'Практика'], ['Словарь', 'Словарь'], ['Прогресс', 'Прогресс'], ['Главная', 'Китайский · HSK 1']] as const) {
    await nav.getByRole('link', { name }).click()
    if (heading) await expect(page.getByRole('heading', { name: heading, level: 1 })).toBeVisible()
  }
})

test('нет горизонтальной прокрутки страницы', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Китайский · HSK 1' })).toBeVisible()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
  expect(overflow).toBe(false)
})

test('карточки: переворот не происходит от озвучки, оценка двигает занятие', async ({ page }) => {
  await page.goto('/#/cards')
  await expect(page.getByText('Новое слово')).toBeVisible()
  await page.getByRole('button', { name: /Озвучить/ }).first().click()
  await expect(page.getByRole('button', { name: 'Перевернуть' })).toBeVisible()
  await page.getByRole('button', { name: 'Перевернуть' }).click()
  await expect(page.getByText('любить')).toBeVisible()
  await page.getByRole('button', { name: /^Помню/ }).click()
  await expect(page.getByText('1/10')).toBeVisible()
  // внутри занятия нижняя навигация скрыта
  await expect(page.getByRole('navigation', { name: 'Основные разделы' })).toHaveCount(0)
})

test('«Не помню» возвращает слово в том же занятии', async ({ page }) => {
  await page.goto('/#/cards')
  await page.getByRole('button', { name: 'Перевернуть' }).click()
  await page.getByRole('button', { name: /^Не помню/ }).click()
  await expect(page.getByText('0/10')).toBeVisible()
  for (let i = 0; i < 3; i++) { await page.getByRole('button', { name: 'Перевернуть' }).click(); await page.getByRole('button', { name: /^Помню/ }).click() }
  await page.getByRole('button', { name: 'Перевернуть' }).click()
  await expect(page.getByText('любить')).toBeVisible()
})

test('упражнение «ввод пиньиня»: ni3 принимается как nǐ, ошибка тона объясняется', async ({ page }) => {
  await page.goto('/#/practice/pinyinInput')
  const field = page.getByLabel('Ваш ответ')
  await expect(field).toBeVisible()
  await field.fill('zzz9')
  await page.getByRole('button', { name: 'Проверить' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Правильно' })).toBeVisible()
})

test('упражнение с выбором: выбранное выделяется, после проверки есть разбор', async ({ page }) => {
  await page.goto('/#/practice/hanzi2meaning')
  const options = page.getByRole('group', { name: 'Варианты ответа' }).getByRole('button')
  await expect(options).toHaveCount(4)
  await options.first().click()
  await page.getByRole('button', { name: 'Проверить' }).click()
  await expect(page.getByRole('status').filter({ hasText: /Верно|Не совсем/ })).toBeVisible()
  await page.getByRole('button', { name: 'Далее' }).click()
  await expect(page.getByText('2/10')).toBeVisible()
})

test('словарь: поиск по пиньиню с цифрой, иероглифу и по-русски', async ({ page }) => {
  await page.goto('/#/dictionary')
  const q = page.getByLabel('Поиск слова')
  await q.fill('ni3')
  await expect(page.getByRole('link', { name: /你.*ты/ }).first()).toBeVisible()
  await q.fill('дочь')
  await expect(page.getByRole('link', { name: /女儿/ })).toBeVisible()
  await q.fill('学生')
  await expect(page.getByRole('link', { name: /学生/ }).first()).toBeVisible()
  await q.fill('ъъъ')
  await expect(page.getByText('Ничего не нашлось')).toBeVisible()
})

test('письмо: холст появляется, анимация запускается', async ({ page }) => {
  await page.goto('/#/writing/%E7%88%B1')
  await expect(page.locator('.writer-box svg')).toBeVisible()
  await page.getByRole('button', { name: '1 Смотреть' }).click()
  await expect(page.getByText('Смотрите, как пишется знак')).toBeVisible()
})

test('демо-режим заполняет прогресс, сброс очищает', async ({ page }) => {
  await page.goto('/#/progress')
  await page.getByRole('button', { name: 'Заполнить демо-данными' }).click()
  await expect(page.getByText('Демо-данные добавлены.')).toBeVisible()
  await expect(page.getByText(/Изучено слов из 300/).locator('..').locator('b')).not.toHaveText('0')
  page.once('dialog', (d) => d.accept())
  await page.getByRole('button', { name: 'Сбросить весь прогресс' }).click()
  await expect(page.getByText('Прогресс сброшен.')).toBeVisible()
})

test('дракон можно выключить в настройках', async ({ page }) => {
  await page.goto('/#/progress')
  await expect(page.getByTestId('dragon')).toHaveCount(1)
  await page.getByLabel(/Дракон на фоне/).uncheck()
  await expect(page.getByTestId('dragon')).toHaveCount(0)
})

test('переворот карточки идёт через анимацию, а скрытая сторона недоступна', async ({ page }) => {
  await page.goto('/#/cards')
  const inner = page.locator('.flip-inner')
  await expect(inner).toHaveCSS('transition-duration', '0.32s')
  await expect(page.locator('.flip-back')).toHaveJSProperty('inert', true)
  await page.getByRole('button', { name: 'Перевернуть' }).click()
  await expect(page.locator('.flip')).toHaveClass(/is-flipped/)
  await expect(page.locator('.flip-face').first()).toHaveJSProperty('inert', true)
  await expect(page.locator('.flip-back')).toHaveJSProperty('inert', false)
})

test('при «уменьшить движение» переворот мгновенный', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/#/cards')
  await expect(page.locator('.flip-inner')).toHaveCSS('transition-duration', '0s')
})
