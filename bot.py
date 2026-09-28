import telebot
from telebot import types
import urllib.parse
import json
from datetime import datetime

BOT_TOKEN = "8075609515:AAGVa9amad2T1X88tey_zLpsxTRsuhO4NRw"
GAME_SHORT_NAME = "voidhunter"
GAME_URL = "https://skimask1448.github.io/VoidHunterUz/"

bot = telebot.TeleBot(BOT_TOKEN)

leaderboard = {}

@bot.message_handler(commands=['start', 'game'], chat_types=['private', 'group', 'supergroup'])
def send_game(message):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] Получена команда {message.text} в чате {message.chat.id} (тип: {message.chat.type})", flush=True)
    
    # 1. Меню-кнопка (доступна только в ЛС)
    if message.chat.type == 'private':
        try:
            bot.set_chat_menu_button(
                message.chat.id,
                types.MenuButtonWebApp(type="web_app", text="🎮 Играть", web_app=types.WebAppInfo(url=GAME_URL))
            )
        except Exception as e:
            print(f"Menu button warning: {e}", flush=True)

    # 2. Сообщение с кнопками запуска
    try:
        markup = types.InlineKeyboardMarkup(row_width=1)
        if message.chat.type == 'private':
            btn_webapp = types.InlineKeyboardButton("🚀 Играть прямо в Telegram", web_app=types.WebAppInfo(url=GAME_URL))
            btn_browser = types.InlineKeyboardButton("🌐 Открыть в браузере", url=GAME_URL)
            btn_top = types.InlineKeyboardButton("🏆 Таблица рекордов", callback_data="show_top")
            markup.add(btn_webapp, btn_browser, btn_top)
            bot.send_message(
                message.chat.id,
                "🌌 **VOID HUNTER** — Космический roguelite-шутер!\n\n"
                "Нажмите кнопку ниже, чтобы начать экспедицию по секторам Галактики:",
                reply_markup=markup,
                parse_mode="Markdown"
            )
        else:
            # Для групповых чатов (Telegram запрещает web_app кнопку в группах, используем прямую ссылку и переход)
            btn_play = types.InlineKeyboardButton("🚀 Играть в Telegram", url="https://t.me/voidhunteruzbot?start=play")
            btn_browser = types.InlineKeyboardButton("🌐 Открыть в браузере", url=GAME_URL)
            markup.add(btn_play, btn_browser)
            bot.send_message(
                message.chat.id,
                "🌌 **VOID HUNTER** готов к бою в группе!\n"
                "Нажмите кнопку ниже или играйте через карточку игры:",
                reply_markup=markup
            )
    except Exception as e:
        print(f"send_message error: {e}", flush=True)

    # 3. Карточка Telegram Game (работает и в группах, и в ЛС)
    try:
        bot.send_game(message.chat.id, GAME_SHORT_NAME)
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Карточка игры успешно отправлена в {message.chat.id}", flush=True)
    except Exception as e:
        print(f"send_game error: {e}", flush=True)

@bot.callback_query_handler(func=lambda c: True)
def launch_game(call):
    try:
        if call.data == "show_top":
            show_top_callback(call)
            return

        user_id = call.from_user.id
        chat_id = call.message.chat.id if call.message else user_id
        name = urllib.parse.quote(call.from_user.first_name or 'Игрок')
        url = f"{GAME_URL}?uid={user_id}&cid={chat_id}&token={BOT_TOKEN}&name={name}"
        bot.answer_callback_query(call.id, url=url)
        print(f"[{datetime.now().strftime('%H:%M:%S')}] 🎮 Запуск игры для {call.from_user.first_name} (id: {user_id})", flush=True)
    except Exception as e:
        print(f"❌ Ошибка launch_game callback: {e}", flush=True)
        try:
            bot.answer_callback_query(call.id, url=GAME_URL)
        except:
            pass

def show_top_callback(call):
    if not leaderboard:
        bot.answer_callback_query(call.id, "📊 Пока никто не играл!", show_alert=True)
        return
    sorted_lb = sorted(leaderboard.values(), key=lambda x: (x['wave'], x['score']), reverse=True)
    text = "🏆 Таблица рекордов:\n\n"
    medals = ["🥇", "🥈", "🥉"]
    for i, entry in enumerate(sorted_lb[:10]):
        medal = medals[i] if i < 3 else f"{i+1}."
        text += f"{medal} {entry['name']} — {entry['score']} очков (волна {entry['wave']})\n"
    bot.send_message(call.message.chat.id, text)
    bot.answer_callback_query(call.id)

@bot.message_handler(func=lambda message: message.text and message.text.startswith('__'))
def handle_game_messages(message):
    text = message.text

    # Обработка результата игры
    if text.startswith('__score__'):
        try:
            # Формат: __score__uid|name|score|wave
            parts = text.replace('__score__', '').split('|')
            uid = int(parts[0])
            name = parts[1]
            score = int(parts[2])
            wave = int(parts[3])

            # Обновить таблицу лидеров
            if uid not in leaderboard or wave > leaderboard[uid]['wave'] or (wave == leaderboard[uid]['wave'] and score > leaderboard[uid]['score']):
                leaderboard[uid] = {
                    'uid': uid,
                    'name': name,
                    'score': score,
                    'wave': wave
                }
                print(f"✅ Результат сохранён: {name} - волна {wave}, {score} очков")
        except Exception as e:
            print(f"❌ Ошибка обработки результата: {e}")

    # Запрос таблицы лидеров
    elif text.startswith('__get_leaderboard__'):
        try:
            # Извлечь uid запрашивающего
            requesting_uid = None
            if len(text) > len('__get_leaderboard__'):
                try:
                    requesting_uid = int(text.replace('__get_leaderboard__', ''))
                except:
                    pass

            # Подготовить данные таблицы
            leaderboard_data = []
            for entry in leaderboard.values():
                leaderboard_data.append({
                    'uid': entry['uid'],
                    'name': entry['name'],
                    'wave': entry['wave'],
                    'score': entry['score']
                })

            # Отправить JSON с таблицей
            response_text = f"__leaderboard__{json.dumps(leaderboard_data)}"
            bot.send_message(message.chat.id, response_text)
            print(f"📊 Отправлена таблица лидеров ({len(leaderboard_data)} игроков)")
        except Exception as e:
            print(f"❌ Ошибка отправки таблицы: {e}")

if __name__ == '__main__':
    import sys
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)
    print("✅ Бот запущен...", flush=True)
    bot.polling(none_stop=True)