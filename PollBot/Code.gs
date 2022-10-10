const USER_ID = "be465863-8705-415b-8688-951ac97e5d3d";
const API_TOKEN = "HIDDEN FOR PRIVACY"; // hidden
const WEB_APP_URL = "HEAD DEPLOYMENT URL"; // hidden
const AUTHOR_ID = "7748a67a-a485-4808-91d7-fdba18d6075b";
const SCRIPT_NAME = "PollBot";
const HEADERS = {
  "x-api-user": USER_ID,
  "x-api-key": API_TOKEN,
  "x-client": AUTHOR_ID + "-" + SCRIPT_NAME
};
const VERSION = 'Version 1';
const scriptProperties = PropertiesService.getScriptProperties();

function send_message(groupId, message) {
  UrlFetchApp.fetch('https://habitica.com/api/v3/groups/' + groupId + '/chat', {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({
      message: message
    }),
    headers: HEADERS
  })
};

function send_private_message(groupId, userId, message) {
  let pm_message = 'This message is sent regarding [this guild](https://habitica.com/groups/guild/' + groupId + ') (' + groupId + '). This message has been sent through a private message as to avoid spam in guilds. We recommend deleting your vote command in the guild as well.\n\n' + message
  const result = JSON.parse(UrlFetchApp.fetch('https://habitica.com/api/v3/members/send-private-message', {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({
      message: pm_message,
      toUserId: userId
    }),
    headers: HEADERS,
    muteHttpExceptions: true
  }));
  if (result.success === false) {
    if (result.message === "You can't send a message to this player because they have chosen to block messages.") {
      pm_message = 'This message was supposed to be sent through a private message, but this user has chosen to block private messages.\n\n' + message;
      send_message(groupId, pm_message);
    } else {
      throw ('Something\'s wrong with the private message-sending.');
    }
  }
}

function trigger() { // will run every 5 minutes
  const startTime = new Date();
  const user = JSON.parse(UrlFetchApp.fetch('https://habitica.com/api/v3/user', {method: 'get', headers: HEADERS}));

  const webhooks_without_guilds = user.data.webhooks.filter(item => !user.data.guilds.includes(item.label));
  if (webhooks_without_guilds.length > 0) {
    for (let wwg=0; wwg<webhooks_without_guilds.length; wwg++) {
      cur_time = new Date();
      if (cur_time.getSeconds - startTime.getSeconds() + 16 < 360) {
        Utilities.sleep(15000);
        UrlFetchApp.fetch('https://habitica.com/api/v3/user/webhook/' + webhooks_without_guilds[wwg].id, {method: 'delete', headers: HEADERS});
      }
    }
  };

  let all_webhooked_guilds = [];
  user.data.webhooks.forEach(item => {all_webhooked_guilds.push(item.label)});
  const guilds_without_webhooks = user.data.guilds.filter(item => !all_webhooked_guilds.includes(item));
  if (guilds_without_webhooks.length > 0) {
    for (let gww=0; gww<guilds_without_webhooks.length; gww++) {
      cur_time = new Date();
      if (cur_time.getSeconds() - startTime.getSeconds() + 31 < 360) {
        Utilities.sleep(30000);
        UrlFetchApp.fetch('https://habitica.com/api/v3/user/webhook', {
          method: 'post',
          contentType: 'application/json',
          payload: JSON.stringify({
            url: WEB_APP_URL,
            label: guilds_without_webhooks[gww],
            type: "groupChatReceived",
            options: {
              groupId: guilds_without_webhooks[gww]
            }
          }),
          headers: HEADERS
        });
      }
    }
  };

  const guilds_without_properties = user.data.guilds.filter(item => !scriptProperties.getKeys().includes('guild-' + item));
  if (guilds_without_properties.length > 0) {
    let id;
    for (let gwp=0; gwp<guilds_without_properties.length; gwp++) {
      id = guilds_without_properties;
      scriptProperties.setProperty('guild-' + id, JSON.stringify({
        polls: [],
        log: [],
        firstinviter: null
      }))
    }
  };

  if (user.data.invitations.guilds.length > 0) {
    let id,
      inviter,
      cur_time;
    for (let inv_n=0; inv_n<user.data.invitations.guilds.length; inv_n++) {
      id = user.data.invitations.guilds[inv_n].id;
      inviter = user.data.invitations.guilds[inv_n].inviter;
      cur_time = new Date();
      if (!user.data.guilds.includes(id) && (cur_time.getSeconds() - startTime.getSeconds() + 95 < 360)) {
        Utilities.sleep(30000);
        UrlFetchApp.fetch('https://habitica.com/api/v3/groups/' + id + '/join', {method: 'post', headers: HEADERS});
        if (!(scriptProperties.getKeys().includes('guild-' + id))) {
          scriptProperties.setProperty('guild-' + id, JSON.stringify({
            polls: [],
            log: [],
            firstinviter: inviter
          }));
        }
        Utilities.sleep(30000);
        UrlFetchApp.fetch('https://habitica.com/api/v3/user/webhook', {
          method: 'post',
          contentType: 'application/json',
          payload: JSON.stringify({
            url: WEB_APP_URL,
            label: id,
            type: "groupChatReceived",
            options: {
              groupId: id
            }
          }),
          headers: HEADERS,
        })
        Utilities.sleep(30000);
        send_message(id, 'Hello! This is @' + user.data.auth.local.username + '. I have successfully been able to join this guild and I am ready to recieve commands. Thank you for inviting me! Try using the `@PollBot help` command to get started!');
      }
    }
  }
};

function make_poll_string(poll_obj, order='natural') {
  let poll_string = '',
    sum = Object.values(poll_obj.option_vote_tracker).reduce((a, b) => a + b, 0),
    top = Math.max(...Object.values(poll_obj.option_vote_tracker));
  poll_string = `Poll #${poll_obj.num}: **${poll_obj.title}** (${poll_obj.status.toUpperCase()}) - ${String(sum)} votes  \nThis poll allows a user to vote ${poll_obj.times_to_vote} times.\n\n`;
  let options = JSON.parse(JSON.stringify(poll_obj.options));
  if (order !== 'natural') {
    if (order === 'forcemosttop') {
      poll_string += 'The options below were ordered by forcing the most-voted ones to the top.\n\n'
      options.sort((a, b) => poll_obj.option_vote_tracker[b] - poll_obj.option_vote_tracker[a]);
    } else if (order === 'forceleasttop') {
      poll_string += 'The options below were ordered by forcing the most-voted ones to the bottom.\n\n'
      options.sort((a, b) => poll_obj.option_vote_tracker[a] - poll_obj.option_vote_tracker[b]);
    }
  } else {
    poll_string += 'The options below were ordered naturally.\n\n'
  };
  let minor_option = '';
  for (let op_n=0; op_n<options.length; op_n++) {
    minor_option = `${poll_obj.options.indexOf(options[op_n]) + 1} - ${options[op_n]}: ${poll_obj.option_vote_tracker[options[op_n]]} votes`;
    if (poll_obj.option_vote_tracker[options[op_n]] === top && top !== 0) {
      minor_option = '**' + minor_option + '**';
    };
    minor_option = '* ' + minor_option;
    minor_option += '\n';
    poll_string += minor_option;
  };
  poll_string += `\n(e.g. Type in \`@PollBot vote #${poll_obj.num} ${poll_obj.options.indexOf(options[0]) + 1}\` if you want to choose the first option.)`
  return poll_string;
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const groupId = data.group.id;
    const sender = '@' + data.chat.username;
    const sender_uuid = data.chat.uuid;
    const profile = '[@PollBot](https://habitica.com/profile/be465863-8705-415b-8688-951ac97e5d3d)';
    let message_f = data.chat.text;
    let property;
    if (message_f.split(' ')[0] === profile) {
      message_f = message_f.replace(/[^\s]*/, '@PollBot');
      if (message_f === '@PollBot' || message_f === '@PollBot ') {
        send_message(groupId, sender + ', ...yes?');
      } else {
        const command = message_f.split(' ')[1];
        if (scriptProperties.getProperty('guild-' + groupId) === null) {
          send_message(groupId, sender + ', well this is odd. I don\'t see the data for this guild. I can\'t run any commands without this. The error should solve itself in time. Try to check back in approximately an hour. We\'re really sorry that this is happening!');
          return;
        };
        property = JSON.parse(scriptProperties.getProperty('guild-' + groupId));
        if (command === 'open') {
          const what_to_follow = /^@PollBot open *\*{2}(.+)\*{2} *([1-9][0-9]*) *((?:\{[^\{\}]+\} *){2,})$/;
          if (what_to_follow.test(message_f)) {
            const result = what_to_follow.exec(message_f);
            const title = result[1];
            const num_of_selects = result[2];
            const options_string = result[3];
            let options = [],
              curoption = '';
            for (let char_n=0; char_n<options_string.length; char_n++) {
              if (options_string[char_n] === '{') {
                curoption = '';
              } else if (options_string[char_n] === '}') {
                options.push(curoption);
              } else {
                curoption += options_string[char_n];
              }
            };
            if ((new Set(options)).size !== options.length) {
              send_message(groupId, sender + ', it seems there are duplicates in the possible options for the poll! Please fix this and try again.');
              return;
            }
            let options_obj = {};
            for (let option=0; option<options.length; option++) {
              options_obj[options[option]] = 0;
            };
            if (num_of_selects > options.length) {
              send_message(groupId, sender + ', the amount of times that a person can vote must be less than the length of the options... try reducing that number!');
              return;
            };
            let poll_num = property.polls.length + 1;
            property.polls.push({
              num: poll_num,
              times_to_vote: num_of_selects,
              title: title,
              option_vote_tracker: options_obj,
              options: options,
              leader: sender_uuid,
              voters: {},
              status: 'open'
            });
            scriptProperties.setProperty('guild-' + groupId, JSON.stringify(property));
            send_message(groupId, sender + ', poll successfully created.\n\n' + make_poll_string(property.polls[poll_num - 1]));
          } else {
            send_message(groupId, sender + ', I detected that you were trying to open a poll. Something is wrong with your formatting, though, so I wasn\'t able to create the poll. Note that your message should match [this regex](https://regexr.com/6uka5). Here are some things that people commonly overlook:\n\n* There must be a space between *@PollBot* and *open*.\n* The options cannot contain the character *{* or *}*.\n* You must have two or more options.\n\nWe hope the error gets resolved soon!\nRemember that you can always use `@PollBot help open` for more general info!');
            return;
          }
        } else if (command === 'vote') {
          const what_to_follow = /^@PollBot vote *#([1-9][0-9]*) +([1-9][0-9]*) *$/;
          if (what_to_follow.test(message_f)) {
            const result = what_to_follow.exec(message_f);
            const poll_num = Number(result[1]);
            const option = Number(result[2]);
              real_poll_num = poll_num === 0 ? null : poll_num - 1,
              real_option = option === 0 ? null : option - 1;
            if (property.polls[real_poll_num] === undefined) {
              send_message(groupId, sender + ', that poll number doesn\'t exist... try a different poll number!');
              return;
            }
            if (property.polls[real_poll_num].status === 'closed') {
              send_message(groupId, sender + ', sorry, this poll has been closed... try voting on something else!');
              return;
            }
            if (property.polls[real_poll_num].options[real_option] === undefined) {
              send_message(groupId, sender + ', that option number doesn\'t exist for that poll... try a different option number!');
              return;
            }
            if (property.polls[real_poll_num].voters[sender_uuid] !== undefined) {
              if (property.polls[real_poll_num].voters[sender_uuid].length + 1 > property.polls[real_poll_num].times_to_vote) {
                send_message(groupId, sender + ', unfortunately, you\'ve already used all your votes on this poll, try voting on something else!');
                return;
              }
              if (property.polls[real_poll_num].voters[sender_uuid].includes(real_option)) {
                send_message(groupId, sender + ', you can\'t vote the same thing that you already have... try voting something else!');
                return;
              }
            }
            property.polls[real_poll_num].option_vote_tracker[property.polls[real_poll_num].options[real_option]]++;
            if (property.polls[real_poll_num].voters[sender_uuid] === undefined) {
              property.polls[real_poll_num].voters[sender_uuid] = [real_option];
            } else {
              property.polls[real_poll_num].voters[sender_uuid].push(real_option);
            }
            scriptProperties.setProperty('guild-' + groupId, JSON.stringify(property));
            send_private_message(groupId, sender_uuid, sender + `, you were able to successfully vote in the poll for option ${option}.\n\n` + make_poll_string(property.polls[real_poll_num]));
          } else {
            send_message(groupId, sender + ', I detected that you were trying to vote on a poll. Something is wrong with your formatting, though, so I wasn\'t able to let you vote on it! I\'m sorry that you are experiencing this error. Note that your message should match [this regex](https://regexr.com/6ukab). Here are some  things that people commonly overlook:\n\n* There must be a space between *@PollBot* and *vote*.\n* The poll number must first have the character *#* in front of it.\n* The poll number and option number must be valid natural numbers.\n\nRemember that you can always use `@PollBot help vote` for more general info!');
            return;
          }
        } else if (command === 'show') {
          const what_to_follow = /^@PollBot show *#([1-9][0-9]*) *(--ordered(?:-reversed)?)? *$/;
          if (what_to_follow.test(message_f)) {
            const result = what_to_follow.exec(message_f);
            const poll_num = Number(result[1]);
            const ordered_input = result[2];
            let ordered_status = 'natural';
            if (ordered_input === '--ordered') {
              ordered_status = 'forcemosttop';
            } else if (ordered_input === '--ordered-reversed') {
              ordered_status = 'forceleasttop';
            };
              real_poll_num = poll_num === 0 ? null : poll_num - 1;
            if (property.polls[real_poll_num] === undefined) {
              send_message(groupId, sender + ', that poll number doesn\'t exist... try a different one!');
              return;
            }
            scriptProperties.setProperty('guild-' + groupId, JSON.stringify(property));
            send_private_message(groupId, sender_uuid, sender + ', here it is!\n\n' + make_poll_string(property.polls[real_poll_num], ordered_status));
          } else {
            send_message(groupId, sender + ', I detected that you were trying to show a poll. Something is wrong with your formatting, though, so I wasn\'t able to let you see it! I\'m sorry that you are experiencing this error. Note that your message should match [this regex](https://regexr.com/6v460). Here are some things that people commonly overlook:\n\n* There must be a space between *@PollBot* and *show*.\n* The poll number must have the character *#* in front of it.\n* The poll number must be a valid natural number.\n\n* The last argument can only be `--ordered` or `--ordered-reversed`.\n\nRemember that you can always use `@PollBot help show` for more general info!');
            return;
          }
        } else if (command === 'close') {
          const what_to_follow = /^@PollBot close *#([1-9][0-9]*) *$/;
          if (what_to_follow.test(message_f)) {
            const result = what_to_follow.exec(message_f);
            const poll_num = Number(result[1]);
              real_poll_num = poll_num === 0 ? null : poll_num - 1;
            if (property.polls[real_poll_num] === undefined) {
              send_message(groupId, sender + ', that poll number doesn\'t exist... try a different one!');
              return;
            }
            if (property.polls[real_poll_num].status === 'closed') {
              send_message(groupId, sender + ', this poll has already been closed!');
              return;
            }
            const group = JSON.parse(UrlFetchApp.fetch('https://habitica.com/api/v3/groups/' + groupId, {method: 'get', headers: HEADERS}));
            if (!(group.data.leader._id === sender_uuid || property.polls[real_poll_num].leader === sender_uuid)) {
              send_message(groupId, sender + ', you have to be the group leader or poll leader to perform this action!');
              return;
            }
            property.polls[real_poll_num].status = 'closed';
            scriptProperties.setProperty('guild-' + groupId, JSON.stringify(property));
            Utilities.sleep(10000);
            send_message(groupId, sender + ', successfully closed!\n\n' + make_poll_string(property.polls[real_poll_num]));
          } else {
            send_message(groupId, sender + ', I detected that you were trying to close a poll. Something is wrong with your formatting, though, so I wasn\'t able to let you close it! I\'m sorry that you are experiencing this error. Note that your message should match [this regex](https://regexr.com/6ukah). Here are some things that people commonly overlook:\n\n* There must be a space between *@PollBot* and *close*.\n* The poll number must have the character *#* in front of it.\n* The poll number must be a valid natural number.\n\nRemember that you can always use `@PollBot help close` for more general info!')
          };
          return;
        } else if (command === 're-open') {
          const what_to_follow = /^@PollBot re-open *#([1-9][0-9]*) *$/;
          if (what_to_follow.test(message_f)) {
            const result = what_to_follow.exec(message_f);
            const poll_num = Number(result[1]),
              real_poll_num = poll_num === 0 ? null : poll_num - 1;
            if (property.polls[real_poll_num] === undefined) {
              send_message(groupId, sender + ', that poll number doesn\'t exist... try a different one!');
              return;
            }
            if (property.polls[real_poll_num].status === 'open') {
              send_message(groupId, sender + ', this poll is open!');
              return;
            }
            const group = JSON.parse(UrlFetchApp.fetch('https://habitica.com/api/v3/groups/' + groupId, {method: 'get', headers: HEADERS}));
            if (!(group.data.leader._id === sender_uuid || property.polls[real_poll_num].leader === sender_uuid)) {
              send_message(groupId, sender + ', you have to be the group leader or poll leader to perform this action!');
              return;
            }
            property.polls[real_poll_num].status = 'open';
            scriptProperties.setProperty('guild-' + groupId, JSON.stringify(property));
            Utilities.sleep(10000);
            send_message(groupId, sender + ', successfully re-opened!\n\n' + make_poll_string(property.polls[real_poll_num]));
          } else {
            send_message(groupId, sender + ', I detected that you were trying to re-open a poll. Something is wrong with your formatting, though, so I wasn\'t able to let you re-open it! I\'m sorry that you are experiencing this error. Note that your message should match [this regex](https://regexr.com/6ukaq). Here are some things that people commonly overlook:\n\n* There must be a space between *@PollBot* and *re-open*.\n* The poll number must have the character *#* in front of it.\n* The poll number must be a valid natural number.\n\nRemember that you can always use `@PollBot help re-open` for more general info!');
          };
          return;
        } else if (command === 'list') {
          if (!/^@PollBot list *(open|closed)? *$/.test(message_f)) {
            send_message(groupId, sender + ', I detected that you were trying to list the polls in this guild. Something is wrong with your formatting, though, so I wasn\'t able to let you re-open it! I\'m sorry that you are experiencing this error. Note that your message should match [this regex](https://regexr.com/6umt1). Here are some things that people commonly overlook:\n\n* There must be a space between *@PollBot* and *list*.\n* The third argument should be "`open`" or "`closed`".\n\nRemember that you can always use `@PollBot help list` for more general info!');
            return;
          }
          const command2 = /^@PollBot list *(open|closed)? *$/.exec(message_f)[1];
          let polls = property.polls.filter(item => {
            if (command2 !== undefined) {
              return (item.status === command2);
            } else {
              return true;
            }
          });
          let mbs, sum;
          if (polls.length === 0) {
            mbs = sender + ', there are no polls that satisfy the requirements you asked for.';
          } else {
            mbs = sender + ', here you go!\n\n';
          };
          let poll_obj;
          for (let i=polls.length - 1; i >= 0; i--) {
            poll_obj = polls[i];
            sum = Object.values(poll_obj.option_vote_tracker).reduce((a, b) => a + b, 0);
            mbs += `* #${String(poll_obj.num)}: **${String(poll_obj.title)}** (${String(poll_obj.status.toUpperCase())}) - ${String(sum)} votes.\n`;
          };
          send_private_message(groupId, sender_uuid, mbs);
        } else if (command === 'version') {
          send_message(groupId, sender + ', this guild is currently running PollBot ' + VERSION + '.');
        } else if (command === 'help') {
          if (!/^@PollBot help *(open|vote|show|close|re-open|list|version)? *$/.test(message_f)) {
            send_message('That isn\'t a valid command, so I can\'t give any info on it!');
            return;
          }
          const command2 = /^@PollBot help *(open|vote|show|close|re-open|list|version)? *$/.exec(message_f)[1];
          const descriptive_cmd_info = {
            'open': 'The `open` command creates a poll, which must follow this format:  \n`@PollBot open **Poll Title** 1 {Option 1}{Option 2}{Option 3}`  \n\n`@PollBot` @mentions PollBot.  \n`open` specifies the command.  \n**Poll Title** specifies the name of the poll and *must* be enclosed in `**`.  \n`1` specifies how many times someone can vote; you can set this to `2` if you allow voting twice; `3` if thrice and so on and so forth.  \n`{Option 1}{Option 2}{Option 3}` are the options; they *must* be enclosed in `{` and `}` symbols and can be repeated as much as you like.  \n\nEXAMPLE:  \n`@PollBot open **Next Quest to Tackle** 1 {Escape the Cave Creature}{Infestation of the NowDo Nudibranchs}{Kangaroo Catastrophe}{Other (Please specify.)}`  \nThe message must follow [this regex](https://regexr.com/6uka5).',
            'vote': 'The `vote` command lets a user vote on a poll. You must specify the poll number, and what option number you\'d like to vote for. These must be separated by spaces. You can only vote for one option per message. The poll number must have a *#* symbol in front of it. It is important to note that if a vote is successfull, the voter will recieve a private message confirmation. Be careful when voting-- you can\'t take a vote back once you\'ve run this command! EXAMPLE: `@PollBot vote #2 1`. The message must follow [this regex](https://regexr.com/6ukab).',
            'show': 'The `show` command lets a user see the results of a poll. You must specify the poll number. You must separate the poll number from the command with a space. The poll number must have a *#* symbol in front of it. You can optionally add `--ordered` or `--ordered-reversed` to order the options by votes. You will receive a private message reponse. EXAMPLE: `@PollBot show #2`. The message must follow [this regex](https://regexr.com/6v460).',
            'close': 'The `close` command lets a user close a poll and make it so that no one can vote on it. Note that this command is only for poll leaders and guild leaders. You must specify the poll number. You must separate the poll number from the command with a space. The poll number must have a *#* symbol in front of it. EXAMPLE: `@PollBot close #2`. The message must follow [this regex](https://regexr.com/6ukah).',
            're-open': 'The `re-open` command re-opens a poll. You must specify the poll number. Note that this command is only for poll leaders and guild leaders. You must specify the poll number. You must separate the poll number from the command with a space. The poll number must have a *#* symbol in front of it. EXAMPLE: `@PollBot re-open #2`. The message must follow [this regex](https://regexr.com/6ukaq).',
            'list': 'The `list` command lists polls for a guild. You may specify "open" or "closed" after the word "list" in your message. Specifying "open" will make @PollBot send a list of the open polls, while specifying "closed" will make @PollBot send a list of closed polls. There must be only ONE space between the word "open" or "closed" and the word "list". EXAMPLE: `@PollBot list` and `@PollBot list open`. You will receive a private message reponse. Your message must follow [this regex](https://regexr.com/6umt1).',
            'version': 'The `version` command shows the version of PollBot running in a guild. There must be only ONE space between the word `@PollBot` and `version`. EXAMPLE: `@PollBot version`.'
          };
          const cmd_info = {
            'open': 'The `open` command creates a poll. Use `@PollBot help open` for detailed info on the syntax & more.',
            'vote': 'The `vote` command lets a user vote on a poll. Use `@PollBot help vote` for detailed info on the syntax & more.',
            'show': 'The `show` command lets a user see the results of a poll. Use `@PollBot help show` for detailed info on the syntax & more.',
            'close': 'The `close` command lets a user close a poll so that no one can vote on it. Use `@PollBot help close` for detailed info on the syntax & more.',
            're-open': 'The `re-open` command re-opens a poll after it has been closed. Use `@PollBot help re-open` for detailed info on the syntax & more.',
            'list': 'The `list` command lists the polls in a guild. Use `@PollBot help list` for detailed info on the syntax & more.',
            'version': 'The `version` command shows the current version PollBot is running in a guild. Use `@PollBot help version` for detailed info on the syntax & more.'
          };
          if (command2 === undefined) {
            let mbs;
            mbs = sender + ', @PollBot is designed to manage polls in a guild. Here\'s a detailed overview of all the commands:\n\n'
            const cmds = Object.keys(cmd_info);
            for (let i=0; i<cmds.length; i++) {
              mbs += `* ${cmds[i]}: ${cmd_info[cmds[i]]}\n`;
            }
            send_private_message(groupId, sender_uuid, mbs);
          } else {
            send_private_message(groupId, sender_uuid, descriptive_cmd_info[command2]);
          }
          scriptProperties.setProperty('guild-' + groupId, JSON.stringify(property));
        } else {
          send_message(groupId, sender + ', I didn\'t recognize that command name. Please try again. You can use `@PollBot help` to list all the possible commands.');
          return;
        }
      }
      property.log.push(data.chat);
      if (property.log.length === 51) {
        property.log.shift();
      }
      scriptProperties.setProperty('guild-' + groupId, JSON.stringify(property));
    }
  } catch (er) {
    scriptProperties.setProperty('er', er);
    throw (er);
  }
}
