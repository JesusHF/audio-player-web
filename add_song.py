import os
import unicodedata
import PySimpleGUI as sg
import simplejson as json
from shutil import copyfile
from sanitize_filename import sanitize
from datetime import date

SONGS_PATH = "songs"
LIBRARY_PATH = "library.json"
CATEGORIES = ["electronic", "happy", "jazz", "lofi", "motivational", "pop"]


def sanitizeName(name):
    newName = sanitize(name).lower()
    newName = newName.replace(" - ", "-")
    newName = newName.replace(" ", "_")
    newName = unicodedata.normalize('NFD', newName).encode('ascii', 'ignore').decode("utf-8")
    return newName


def getAllFileNamesFrom(folder):
    try:
        file_list = os.listdir(folder)
    except:
        file_list = []
    fnames = [
        f
        for f in file_list
        if os.path.isfile(os.path.join(folder, f))
        and f.lower().endswith((".mp3", ".wav"))
    ]
    return fnames


def getSongFolderAbs(values):
    path = os.path.join(os.getcwd(), getSongFolderRel(values))
    return path


def getSongFolderRel(values):
    cat_folder = ""
    for cat in CATEGORIES:
        if values["-cat-"+cat] is True:
            cat_folder = cat
    return os.path.join(SONGS_PATH, cat_folder)


def getArtistName(name):
    tokens = name.split("-")
    if len(tokens) >= 2:
        return tokens[0]
    else:
        return "Insert Artist Name"


def getSongName(name):
    tokens = name.split("-")
    if len(tokens) >= 2:
        return tokens[1]
    else:
        return name


def updatePreviewText(text_obj, path, artist, song, using_backslashes=True):
    file = artist + "-" + song
    previewText = os.path.join(path, file)
    if using_backslashes is False:
        previewText = previewText.replace("\\", "/")
    text_obj.update(previewText)
    return previewText


def addSongToLibrary(rel_path, artist, song, album, date, path):
    category = sanitize(rel_path.replace(SONGS_PATH, ""))
    sane_artist = ""
    for idx, val in enumerate(artist.split("_")):
        if idx > 0:
            sane_artist += " "
        sane_artist += val.capitalize()
    sane_song = ""
    for idx, val in enumerate(song[:-4].split("_")):
        if idx > 0:
            sane_song += " "
        sane_song += val.capitalize()
    jsonObject = {
        "song_artist": sane_artist,
        "song_name": sane_song,
        "song_album": album,
        "song_date": date,
        "song_path": path
    }
    with open(LIBRARY_PATH, "r+") as jsonFile:
        library = json.load(jsonFile)
        for c in library["categories"]:
            if c["category_name"].lower().replace("-", "") == category:
                c["category_songs"].append(jsonObject)

        jsonFile.seek(0)  # rewind
        json.dump(library, jsonFile, indent=2)
        jsonFile.truncate()
    return


if __name__ == "__main__":
    sg.theme('DarkBlack1')
    select_file_column = [
        [
            sg.Text("Choose one file"),
            sg.In(size=(25, 1), enable_events=True, key="-FOLDER-"),
            sg.FolderBrowse(),
        ],
        [
            sg.Listbox(
                values=[], enable_events=True, size=(50, 20), key="-FILE LIST-"
            )
        ],
    ]
    add_song_column = [
        [sg.Text("Choose a song from list on left:")],
        [sg.Text(size=(70, 1), key="-SRC-", background_color='#333333')],
        [sg.Text("Sanitized name:")],
        [sg.Text(size=(70, 1), key="-SANE-SRC-", background_color='#333333')],
        [
            sg.Radio(CATEGORIES[0], "category", key="-cat-" + CATEGORIES[0], enable_events=True, default=True),
            sg.Radio(CATEGORIES[1], "category", key="-cat-" + CATEGORIES[1], enable_events=True),
            sg.Radio(CATEGORIES[2], "category", key="-cat-" + CATEGORIES[2], enable_events=True),
        ],
        [
            sg.Radio(CATEGORIES[3], "category", key="-cat-" + CATEGORIES[3], enable_events=True),
            sg.Radio(CATEGORIES[4], "category", key="-cat-" + CATEGORIES[4], enable_events=True),
            sg.Radio(CATEGORIES[5], "category", key="-cat-" + CATEGORIES[5], enable_events=True),
        ],
        [
            sg.Text("Artist: "),
            sg.InputText(size=(25, 1), key="-ARTIST-", enable_events=True),
        ],
        [
            sg.Text("Song name: "),
            sg.InputText(size=(25, 1), key="-SONG-", enable_events=True),
        ],
        [
            sg.Text("Album: "),
            sg.InputText(size=(25, 1), key="-ALBUM-"),
        ],
        [
            sg.Text("Date: "),
            sg.InputText(size=(25, 1), key="-DATE-", disabled=True),
        ],
        [
            sg.Text("Relative Path: ")],
        [
            sg.InputText(size=(70, 1), key="-PATH-", disabled=True),
        ],
        [sg.Text("Preview:")],
        [sg.Text(size=(70, 1), key="-PREVIEW-", background_color='#333333')],
        [sg.Button("Add to library")],
    ]
    layout = [
        [
            sg.Column(select_file_column),
            sg.VSeperator(),
            sg.Column(add_song_column),
        ]
    ]
    window = sg.Window(title="Add new song", layout=layout)

    src_path = ""
    dest_folder = ""
    dest_folder_rel = ""
    artist_name = ""
    song_name = ""
    while True:
        event, values = window.read()
        if event == "Exit" or event == sg.WIN_CLOSED:
            break

        if event == "-FOLDER-":
            fnames = getAllFileNamesFrom(values["-FOLDER-"])
            window["-FILE LIST-"].update(fnames)
            window["-ALBUM-"].update("Single")

        elif event == "-FILE LIST-":
            try:
                src_path = values["-FOLDER-"] + "/" + values["-FILE LIST-"][0]
                sanitized_name = sanitizeName(values["-FILE LIST-"][0])
                dest_folder = getSongFolderAbs(values)
                dest_folder_rel = getSongFolderRel(values)
                window["-SRC-"].update(src_path)
                window["-SANE-SRC-"].update(sanitized_name)

                artist_name = getArtistName(sanitized_name)
                song_name = getSongName(sanitized_name)
                today_date = date.today().strftime("%d/%m/%Y")

                window["-ARTIST-"].update(artist_name)
                window["-SONG-"].update(song_name)
                window["-DATE-"].update(today_date)
                # window["-PATH-"].update(new_song_path_rel)

                updatePreviewText(window["-PATH-"], dest_folder_rel, artist_name, song_name, False)
                updatePreviewText(window["-PREVIEW-"], dest_folder, artist_name, song_name)
            except:
                pass

        elif event.startswith("-cat-"):
            dest_folder = getSongFolderAbs(values)
            dest_folder_rel = getSongFolderRel(values)
            updatePreviewText(window["-PATH-"], dest_folder_rel, artist_name, song_name, False)
            updatePreviewText(window["-PREVIEW-"], dest_folder, artist_name, song_name)

        elif event == "-ARTIST-" or event == "-SONG-":
            artist_name = values["-ARTIST-"]
            song_name = values["-SONG-"]
            updatePreviewText(window["-PATH-"], dest_folder_rel, artist_name, song_name, False)
            updatePreviewText(window["-PREVIEW-"], dest_folder, artist_name, song_name)

        elif event == "Add to library":
            new_name = artist_name + "-" + song_name
            new_song_path = os.path.join(dest_folder, new_name)
            try:
                addSongToLibrary(
                    dest_folder_rel,
                    values["-ARTIST-"],
                    values["-SONG-"],
                    values["-ALBUM-"],
                    values["-DATE-"],
                    values["-PATH-"]
                )
                copyfile(src_path, new_song_path)
                sg.Popup("Copied successfuly")
                # update file list
                fnames = getAllFileNamesFrom(values["-FOLDER-"])
                window["-FILE LIST-"].update(fnames)
            except:
                sg.Popup("Couldn't copy to destination")
                pass

    window.close()
