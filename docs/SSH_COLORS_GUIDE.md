# SSH Terminal Color Guide

## Как работают цвета в терминале

### Архитектура цветов

SSH терминал использует **ANSI escape коды** для отображения цветов. Это означает, что:

1. **Сервер отправляет ANSI коды** (например, `\x1b[31m` для красного цвета)
2. **xterm.js интерпретирует эти коды** и применяет цвета из темы
3. **Клиент (наше приложение) определяет палитру** через настройки темы

### Важно понимать

❌ **Клиент НЕ парсит команды** (ping, ls, grep) для добавления цветов  
✅ **Сервер отправляет цвета** через ANSI escape коды  
✅ **Клиент только интерпретирует** эти коды согласно выбранной теме

## Цветовая палитра

### 16 базовых ANSI цветов (0-15)

| Код | Цвет | ANSI код | Использование |
|-----|------|----------|---------------|
| 0 | Black | `\x1b[30m` | Фон, обычный текст |
| 1 | Red | `\x1b[31m` | Ошибки, архивы |
| 2 | Green | `\x1b[32m` | Успех, исполняемые файлы |
| 3 | Yellow | `\x1b[33m` | Предупреждения, порты |
| 4 | Blue | `\x1b[34m` | Информация |
| 5 | Magenta | `\x1b[35m` | Ссылки, изображения |
| 6 | Cyan | `\x1b[36m` | IP адреса, аудио |
| 7 | White | `\x1b[37m` | Обычный текст |
| 8 | Bright Black | `\x1b[1;30m` | Серый текст |
| 9 | Bright Red | `\x1b[1;31m` | Яркие ошибки |
| 10 | Bright Green | `\x1b[1;32m` | Яркий успех |
| 11 | Bright Yellow | `\x1b[1;33m` | Яркие предупреждения |
| 12 | **Bright Blue** | `\x1b[1;34m` | **ДИРЕКТОРИИ в ls!** |
| 13 | Bright Magenta | `\x1b[1;35m` | Яркие ссылки |
| 14 | **Bright Cyan** | `\x1b[1;36m` | **СИМЛИНКИ в ls!** |
| 15 | Bright White | `\x1b[1;37m` | Яркий белый |

### 256-цветная палитра (16-255)

- **Цвета 16-231**: RGB куб 6×6×6 (216 цветов)
- **Цвета 232-255**: Градации серого (24 оттенка)

## LS_COLORS - Ключ к цветам в ls

### Что такое LS_COLORS?

`LS_COLORS` - это переменная окружения, которая определяет, какие ANSI коды использовать для разных типов файлов в команде `ls`.

### Формат

```bash
LS_COLORS="di=1;34:ln=1;36:ex=1;32:*.tar=1;31"
```

Где:
- `di=1;34` - directories (директории) = bright blue
- `ln=1;36` - symlinks (символические ссылки) = bright cyan
- `ex=1;32` - executables (исполняемые файлы) = bright green
- `*.tar=1;31` - tar архивы = bright red

### Наша конфигурация

Приложение автоматически устанавливает `LS_COLORS` при открытии shell:

```typescript
const LS_COLORS = [
  'di=1;34',        // directories - bright blue
  'ln=1;36',        // symlinks - bright cyan
  'ex=1;32',        // executables - bright green
  '*.tar=1;31',     // archives - bright red
  '*.jpg=1;35',     // images - bright magenta
  '*.mp3=0;36',     // audio - cyan
  '*.pdf=0;37',     // documents - white
].join(':');
```

## Тестирование цветов

### 1. Проверка 256-цветной поддержки

```bash
# Показать все 256 цветов
for i in {0..255}; do
  printf "\x1b[38;5;${i}mcolour${i}\x1b[0m\n"
done
```

### 2. Проверка базовых ANSI цветов

```bash
# Показать 16 базовых цветов
msgcat --color=test
```

### 3. Проверка LS_COLORS

```bash
# Создать тестовые файлы
mkdir test_colors
cd test_colors
touch file.txt
touch executable.sh && chmod +x executable.sh
ln -s file.txt symlink.txt
mkdir directory
tar -czf archive.tar.gz file.txt

# Показать с цветами
ls -la --color=auto
```

Вы должны увидеть:
- 🔵 **directory** - синий (bright blue)
- 🟢 **executable.sh** - зелёный (bright green)
- 🔷 **symlink.txt** - голубой (bright cyan)
- 🔴 **archive.tar.gz** - красный (bright red)
- ⚪ **file.txt** - белый (normal)

### 4. Проверка цветов в ping

```bash
ping -c 4 8.8.8.8
```

IP адреса должны быть выделены цветом (зависит от сервера).

### 5. Проверка цветов в grep

```bash
echo "error: something went wrong" | grep --color=auto error
echo "success: operation completed" | grep --color=auto success
```

## Темы

### Доступные темы

1. **Termius Dark** (по умолчанию) - оригинальная тёмная тема Termius
2. **Termius Light** - светлая тема Termius
3. **Matrix** - классический зелёный на чёрном
4. **Dracula** - популярная тёмная тема
5. **Nord** - холодная северная палитра
6. **Monokai** - тёплые цвета Monokai
7. **Solarized Dark** - классическая Solarized
8. **Cyberpunk** - неоновые цвета киберпанка
9. **Ocean** - глубокие морские цвета
10. **Gruvbox** - ретро тёплые тона
11. **One Dark** - популярная тема Atom
12. **Tokyo Night** - современная ночная тема
13. **GitHub Dark** - тёмная тема GitHub

### Создание своей темы

Чтобы создать свою тему, добавьте объект в `SSHThemes.ts`:

```typescript
{
  id: 'my-theme',
  name: 'My Theme',
  description: 'Моя кастомная тема',
  background: '#000000',    // Фон терминала
  foreground: '#ffffff',    // Основной текст
  cursor: '#00ff00',        // Курсор
  
  // 16 базовых ANSI цветов
  // Эти цвета используются когда сервер отправляет ANSI коды
  
  // Семантические цвета (для UI элементов)
  prompt: '#00ffff',        // Цвет промпта
  command: '#ffffff',       // Цвет команды
  output: '#ffffff',        // Цвет вывода
  error: '#ff0000',         // Цвет ошибок
  info: '#00ffff',          // Цвет информации
  success: '#00ff00',       // Цвет успеха
  warning: '#ffff00',       // Цвет предупреждений
  
  // Специальные цвета (используются в LS_COLORS)
  ip: '#00ffff',            // IP адреса
  mac: '#00ff00',           // MAC адреса
  port: '#ffff00',          // Порты
  number: '#ffff00',        // Числа
  keyword: '#00ffff',       // Ключевые слова
  path: '#00ff00',          // Пути
  file: '#ffffff',          // Файлы
  directory: '#0000ff',     // Директории (bright blue!)
  link: '#ff00ff',          // Ссылки (bright cyan!)
  executable: '#00ff00',    // Исполняемые файлы (bright green!)
  permissions: '#ffaa00',   // Права доступа
  user: '#00ffff',          // Пользователь
  group: '#00aaff',         // Группа
  date: '#aaaaaa',          // Дата
  size: '#ffff00',          // Размер
}
```

## Переменные окружения

Приложение автоматически устанавливает следующие переменные:

```bash
TERM=xterm-256color          # Поддержка 256 цветов
COLORTERM=truecolor          # Поддержка 24-bit цветов
CLICOLOR=1                   # Включить цвета
CLICOLOR_FORCE=1             # Принудительно включить цвета
```

## Troubleshooting

### Проблема: Цвета не отображаются

**Решение:**
1. Проверьте, что `TERM=xterm-256color`:
   ```bash
   echo $TERM
   ```

2. Проверьте, что `LS_COLORS` установлена:
   ```bash
   echo $LS_COLORS
   ```

3. Используйте `--color=auto` или `--color=always`:
   ```bash
   ls --color=auto
   ```

### Проблема: Директории не синие

**Решение:**
Убедитесь, что в теме `directory` установлен в синий цвет (bright blue):
```typescript
directory: '#569cd6',  // или любой синий оттенок
```

И что в `buildXtermTheme` используется:
```typescript
brightBlue: t.directory,  // Для директорий в ls
```

### Проблема: Некоторые программы не показывают цвета

**Решение:**
Некоторые программы проверяют, является ли вывод TTY. Используйте:
```bash
export CLICOLOR_FORCE=1
```

## Дополнительные ресурсы

- [ANSI Escape Codes](https://gist.github.com/fnky/458719343aabd01cfb17a3a4f7296797)
- [xterm.js Documentation](https://xtermjs.org/docs/)
- [LS_COLORS Generator](https://geoff.greer.fm/lscolors/)
- [Terminal Color Schemes](https://github.com/mbadolato/iTerm2-Color-Schemes)

## Заключение

Цвета в терминале - это результат взаимодействия между:
1. **Сервером** (отправляет ANSI коды)
2. **LS_COLORS** (определяет, какие коды использовать для файлов)
3. **Темой** (определяет, какие RGB цвета соответствуют ANSI кодам)

Наше приложение правильно настраивает все три компонента для красивого и функционального терминала! 🎨
