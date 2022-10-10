/* ========================================== */
/* [Users] Required script data to fill in    */
/* ========================================== */
const USER_ID = "PasteYourUserIdHere";
const API_TOKEN = "PasteYourApiTokenHere"; // Do not share this to anyone

/* ========================================== */
/* [Users] Optional customizations to fill in */
/* ========================================== */
const INACTIVE_DAYS_TO_NOTIFY_AFTER = 3;        // You would like to be notified when a party member is inactive for `INACTIVE_DAYS_TO_NOTIFY_AFTER` days.
const WHERE_TO_POST_NOTIFICATIONS = "DEFAULT"; // NONE DEFAULT or party guild id
const AUTO_KICK = true;        // true or false
const DISABLE_IN_TAVERN = true; // true or false

/* ========================================== */
/* [Users] Do not edit code below this line   */
/* ========================================== */

// Headers and initialization
const start = new Date();
start.setSeconds(start.getSeconds() - 10, start.getMilliseconds())
const AUTHOR_ID = "7748a67a-a485-4808-91d7-fdba18d6075b";
const SCRIPT_NAME = "Notify Party Leader for Inactive Members";
const HEADERS = {
  'x-api-user': USER_ID,
  'x-api-key': API_TOKEN,
  'x-client': AUTHOR_ID + '-' + SCRIPT_NAME
};
const user = JSON.parse(UrlFetchApp.fetch('https://habitica.com/api/v3/user', { method: 'get', headers: HEADERS }));

// validate the consonents
function validate() {
  valid = true;

  try {
    Utilities.sleep(3000);
    const party = JSON.parse(UrlFetchApp.fetch('https://habitica.com/api/v3/groups/' + String(user.data.party._id), { method: 'get', headers: HEADERS }));
    if (party.data.leader._id !== USER_ID) { // if not party leader
      Logger.log('ERROR: You aren\'t a party leader!');
      valid = false;
      return false;
    }

  } catch (e) {
    Logger.log('ERROR: Your USER_ID or API_TOKEN is incorrect.');
    valid = false;
    return false;
  };

  if (INACTIVE_DAYS_TO_NOTIFY_AFTER <= 0 || typeof INACTIVE_DAYS_TO_NOTIFY_AFTER !== 'number') {
    Logger.log('ERROR: Your INACTIVE_DAYS_TO_NOTIFY_AFTER variable is either 0, below 0, or not a number.');
    valid = false;
  }

  try {
    Utilities.sleep(3000);
    UrlFetchApp.fetch('https://habitica.com/api/v3/groups/' + WHERE_TO_POST_NOTIFICATIONS, { method: 'get', headers: HEADERS }); // check that where to post notifications (const) works
  } catch (e) {
    if (WHERE_TO_POST_NOTIFICATIONS !== "DEFAULT" && WHERE_TO_POST_NOTIFICATIONS !== "NONE") {
      Logger.log('ERROR: Your WHERE_TO_POST_NOTIFICATIONS variable is not a valid group id or possible string.');
      valid = false;
    }
  }

  if (typeof AUTO_KICK !== 'boolean') { // test AUTO_KICK 
    Logger.log('ERROR: Your AUTO_KICK variable must be set to true or false.');
    valid = false;
  }

  if (typeof DISABLE_IN_TAVERN !== 'boolean') { // test DISABLE_IN_TAVERN
    Logger.log("ERROR: Your DISABLE_IN_TAVERN variable must be set to true or false.");
  }

  return valid;
}

function post(user, pages) {
  let postTo = [];  // will save the groups to post to
  if (WHERE_TO_POST_NOTIFICATIONS === "DEFAULT") {
    postTo.push(user.data.party._id);
  } else if (WHERE_TO_POST_NOTIFICATIONS !== "NONE") {
    postTo.push(WHERE_TO_POST_NOTIFICATIONS);
  }
  for (let p_num=0; p_num<pages.length; p_num++) {
    Utilities.sleep(30000);
    UrlFetchApp.fetch('https://habitica.com/api/v3/members/send-private-message', { // send private message with details
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({
        message: pages[p_num],
        toUserId: USER_ID
      }),
      headers: HEADERS
    });
    for (let pt_num=0; pt_num<postTo.length; pt_num++) {
      Utilities.sleep(30000); 
      JSON.parse(UrlFetchApp.fetch('https://habitica.com/api/v3/groups/' + postTo[pt_num] + '/chat', { // post to group with details
        method: 'post',
        contentType: 'application/json',
        payload: JSON.stringify({
          message: pages[p_num]
        }),
        headers: HEADERS
      }));
    }
  }
}

function triggerThis() {
  if (!validate()) { // if the consonents are incorrect
    throw Error() // error
  };
  Utilities.sleep(3000);
  const pmd = (JSON.parse(UrlFetchApp.fetch('https://habitica.com/api/v3/groups/' + String(user.data.party._id) + '/members?includeAllPublicFields=true', { method: 'get', headers: HEADERS }))).data; // get info from api

  let rn = new Date(),                                           // initialize variablels
    limit = new Date(),
    last_log,
    cur,
    pink,
    message,
    pages = ['Update from ' + SCRIPT_NAME + ': (Page 1)\n'],
    p_n = 0,
    date;
  limit.setDate(rn.getDate() - INACTIVE_DAYS_TO_NOTIFY_AFTER);

  for (let pm_n=0; pm_n<pmd.length; pm_n++) {
    cur = pmd[pm_n];
    if (cur._id === USER_ID) {
      continue;
    };
    last_log = new Date(cur.auth.timestamps.loggedin);
    message = 'Last login: ' + String(last_log)
    pink = (last_log.valueOf() <= limit.valueOf());
    if (cur.preferences.sleep) { // if in tavern
      if (DISABLE_IN_TAVERN) {
        pink = false;            // set pink to false
      } 
      message += ', Tavern Status: in.';  // update message
    } else { // if not in tavern
      message += ', Tavern Status: out.'; // update message
    };

    if (pink) {
      if (AUTO_KICK) { 
        date = new Date();
        if ((date.getSeconds() - start.getSeconds()) + 30*(WHERE_TO_POST_NOTIFICATIONS === "NONE" ? 2 : 4) < 360) { // if we have time, 
          Utilities.sleep(30000);
          UrlFetchApp.fetch('https://habitica.com/api/v3/groups/' + user.data.party._id + '/removeMember/' + cur._id, {method: 'post', headers: HEADERS}); // kick user
          message += ' Auto-kicked.' // update message
        } else {
          message += ' TIMEOUT ERROR: We\'ll try to kick this member tomorrow.'
        }
      }
      message = '`' + message + '`'; // make it pink
    };
    message = '* @' + cur.auth.local.username + ' ' + message + '\n' // formatting
    if ((pages[p_n] + message).length > 3000) { // reset page if goes over char limit
      pages.push('');
      p_n++;
      pages[p_n] = 'Update from ' + SCRIPT_NAME + ': (Page ' + String(p_n + 1) + ')\n'
    }
    pages[p_n] += message; // add to page
  }
  post(user, pages); // post the pages
}
