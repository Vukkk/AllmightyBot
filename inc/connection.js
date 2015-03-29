/*
 * AllmightyBot Node - https://github.com/RyanTheAllmighty/AllmightyBot-Node
 * Copyright (C) 2015 RyanTheAllmighty
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

var irc = require('twitch-irc');
var db = require('twitch-irc-db')({database: './data'});
var api = require('twitch-irc-api');

var settings = require('../settings.json');

var client = new irc.client({
    options: {
        debug: true,
        debugDetails: true
    },
    identity: {
        username: settings.bot_username,
        password: settings.bot_oauth_token
    },
    channels: settings.channels_to_join
});

module.exports.client = client;