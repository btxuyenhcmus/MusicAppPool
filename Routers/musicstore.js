const express = require('express');
const router = express.Router();

const { search_general, filter_song, update_like, update_view } = require('../Controllers/song');
const { add_playlist, update_playlist, delete_playlist, get_playlist_user } = require('../Controllers/playlist');
const { list_song_from_playlist, add_song_to_playlist, delete_song_from_playlist } = require('../Controllers/playlistAndSong');

//Song routers
router.get('/song/queryall/:pagesize/:pagenum', search_general);

router.get('/song/queries/:pagesize/:pagenum', filter_song);

router.put('/song/updatelike', update_like);

router.put('/song/updateview', update_view);

// playlist routers
router.get('/playlist/list', get_playlist_user);

router.post('/playlist', add_playlist);

router.put('/playlist', update_playlist);

router.delete('/playlist', delete_playlist);

// Playlist and song routers
router.get('/playlist/listsong', list_song_from_playlist);

router.post('/playlist/song', add_song_to_playlist);

router.delete('/playlist/song', delete_song_from_playlist);

module.exports = router;

