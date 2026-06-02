import telebot
import urllib.parse
import json

BOT_TOKEN = "8075609515:AAGVa9amad2T1X88tey_zLpsxTRsuhO4NRw"
GAME_SHORT_NAME = "voidhunter"
GAME_URL = "https://skimask1448.github.io/VoidHunterUz/"

bot = telebot.TeleBot(BOT_TOKEN)

leaderboard = {}

@bot.message_handler(commands=['start', 'game'], chat_types=['private', 'group', 'supergroup'])
def send_game(message):
    bot.send_game(message.chat.id, GAME_SHORT_NAME)

@bot.callback_query_handler(func=lambda c: True)
def launch_game(call):
    user_id = call.from_user.id
    chat_id = call.message.chat.id if call.message else user_id
    name = urllib.parse.quote(call.from_user.first_name or 'Игрок')
    url = f"{GAME_URL}?uid={user_id}&cid={chat_id}&token={BOT_TOKEN}&name={name}"
    bot.answer_callback_query(call.id, url=url)

@bot.message_handler(commands=['top'], chat_types=['private', 'group', 'supergroup'])
def show_top(message):
    if not leaderboard:
        bot.send_message(message.chat.id, "📊 Пока никто не играл!")
        return
    sorted_lb = sorted(leaderboard.values(), key=lambda x: (x['wave'], x['score']), reverse=True)
    text = "🏆 Таблица рекордов:\n\n"
    medals = ["🥇", "🥈", "🥉"]
    for i, entry in enumerate(sorted_lb[:10]):
        medal = medals[i] if i < 3 else f"{i+1}."
        text += f"{medal} {entry['name']} — {entry['score']} очков (волна {entry['wave']})\n"
    bot.send_message(message.chat.id, text)

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