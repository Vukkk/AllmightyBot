/*
 * AllmightyBot - https://github.com/RyanTheAllmighty/AllmightyBot
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

'use strict';

var connection = require('./connection');
var r = require('rethinkdbdash')();

module.exports.isLive = function (callback) {
    r.db('allmightybot').table('streaming_times').filter(r.row('event').eq('start')).orderBy(r.desc('time')).limit(1).run().then(function (start) {
        r.db('allmightybot').table('streaming_times').filter(r.row('event').eq('end')).orderBy(r.desc('time')).limit(1).run().then(function (end) {
            var live = !((start.length == 0 && end.length == 0) || ((start.length == end.length) && module.exports.timeBetween(start[0].time, end[0].time, true) < 0));

            callback(null, live, (live ? start[0].time : null));
        }).error(function (err) {
            callback(err);
        });
    }).error(function (err) {
        callback(err);
    });
};

module.exports.calculateEyetime = function (username, callback) {
    r.db('allmightybot').table('user_parts').filter(r.row('username').eq(username)).orderBy(r.asc('time')).run().then(function (parts) {
            r.db('allmightybot').table('user_joins').filter(r.row('username').eq(username)).orderBy(r.asc('time')).run().then(function (joins) {
                var joinTimes = [];
                var partTimes = [];
                var secondsInChannel = 0;

                joins.forEach(function (join) {
                    joinTimes.push(join.time);
                });

                parts.forEach(function (part) {
                    partTimes.push(part.time);
                });

                for (var i = 0; i < partTimes.length; i++) {
                    var partTime = partTimes[i];
                    var theJoin = null;

                    if (partTimes.length - 1 > i) {
                        for (var j = 0; j < joinTimes.length; j++) {
                            var joinTime = joinTimes[j];

                            if (joinTime < partTime) {
                                theJoin = joinTime;
                            } else {
                                break;
                            }
                        }
                    } else {
                        theJoin = joinTimes[joinTimes.length - 1];
                        partTime = new Date();
                    }

                    if (theJoin != null) {
                        secondsInChannel += module.exports.timeBetween(partTime, theJoin, true);
                    }
                }

                callback(null, secondsInChannel);
            }).error(function (err) {
                callback(err);
            });
        }
    ).error(function (err) {
            callback(err);
        });
};

module.exports.timeBetween = function (this_date, and_this_date, return_seconds) {
    if (typeof return_seconds != "boolean") {
        return_seconds = false;
    }

    var dif = this_date.getTime() - and_this_date.getTime();

    var Seconds_from_T1_to_T2 = dif / 1000;
    var totalSeconds = Math.floor(Seconds_from_T1_to_T2);

    if (return_seconds) {
        return totalSeconds;
    } else {
        return module.exports.secondsToString(totalSeconds);
    }
};

module.exports.secondsToString = function (totalSeconds) {
    var HOURS_IN_A_DAY = 24;
    var MINUTES_IN_AN_HOUR = 60;
    var SECONDS_IN_A_MINUTE = 60;

    var seconds = Math.floor(totalSeconds % SECONDS_IN_A_MINUTE);

    var totalMinutes = Math.floor(totalSeconds / SECONDS_IN_A_MINUTE);
    var minutes = Math.floor(totalMinutes % MINUTES_IN_AN_HOUR);

    var totalHours = Math.floor(totalMinutes / MINUTES_IN_AN_HOUR);
    var hours = Math.floor(totalHours % HOURS_IN_A_DAY);

    var days = Math.floor(totalHours / HOURS_IN_A_DAY);

    if (days != 0) {
        return days + " day" + (days == 1 ? "" : "s") + ", " + hours + " hour" + (hours == 1 ? "" : "s") + ", " + minutes + " minute" + (hours == 1 ? "" : "s") + " and " + seconds + " second" +
            (hours == 1 ? "" : "s");
    } else {
        if (hours != 0) {
            if (minutes != 0) {
                if (seconds == 0) {
                    return hours + " hour" + (hours == 1 ? "" : "s") + ", " + minutes + " minute" + (minutes == 1 ? "" : "s");
                } else {
                    return hours + " hour" + (hours == 1 ? "" : "s") + ", " + minutes + " minute" + (minutes == 1 ? "" : "s") + " and " + seconds + " second" + (seconds == 1 ? "" : "s");
                }
            } else {
                if (seconds == 0) {
                    return hours + " hour" + (hours == 1 ? "" : "s");
                } else {
                    return hours + " hour" + (hours == 1 ? "" : "s") + ", " + seconds + " second" + (seconds == 1 ? "" : "s");
                }
            }
        } else {
            if (minutes != 0) {
                if (seconds == 0) {
                    return minutes + " minute" + (minutes == 1 ? "" : "s");
                } else {
                    return minutes + " minute" + (minutes == 1 ? "" : "s") + " and " + seconds + " second" + (seconds == 1 ? "" : "s");
                }
            } else {
                return seconds + " second" + (seconds == 1 ? "" : "s");
            }
        }
    }
}

module.exports.getMessageParts = function (message) {
    var re = /([^"]\S*|\".+?\")\s*/g;
    var m;

    var matches = [];

    do {
        m = re.exec(message);
        if (m) {
            if (m[1][0] == '"') {
                m[1] = m[1].slice(1);
            }

            if (m[1][m[1].length - 1] == '"') {
                m[1] = m[1].slice(0, m[1].length - 1);
            }

            matches.push(m[1]);
        }
    } while (m);

    return matches;
};