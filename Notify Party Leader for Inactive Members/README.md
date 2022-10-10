# Notify Party Leader for Inactive Members

This script will notify the party leader when a member is inactive in their party.

## Detailed Description:
Every day, this script will send the last logins for all the party members, and whether they were in the tavern or not. If a user goes beyond their party's restrictions, their name will be highlighted in pink and/or they will be auto-kicked.

## Steps for Installation:
NOTE: When I say "Set the variable `var_name` to `x` on line `n`," it means: Find the place on line `n` where it is written `const VAR_NAME =` and then there should be a value, and then a semicolon `;`. Change the value between the `const VAR_NAME =` and `;` to `x`.

1. Create a new project in [Google Scripts](https://script.google.com).
2. Title your project "Notify Party Leader for Inactive Members". (optional step)
3. Remove all intial text. ("yourFunction")
4. Copy and paste [Code.gs](Code.gs) into the file.
5. Replace the text (on line 4) `PasteYourUserIdHere` with your user id, which you can find [here](https://habitica.com/user/settings/api). (leave the quotes).
6. Replace the text (on line 5)`PasteYourApiTokenHere` with your api token, which you can find [here](https://habitica.com/user/settings/api). (leave the quotes).
7. Set the variable `INACTIVE_DAYS_TO_NOTIFY_AFTER` on line `10` to whatever fits the 'x' in the following sentence: I'd like to know (and/or kick) if a party member member has been inactive for more than 'x' days.
8. Set the variable `WHERE_TO_POST_NOTIFICATIONS` on line `11` to `NONE` (leave the quotes) if you'd like to be notified only in your PMS, to `DEFAULT` (leave the quotes) if you'd like to be notified in your PMS and in the party, and to a guild id (leave the quotes), if you'd like to be notified in that guild id, and in the PMS.
9. Set the variable `AUTO_KICK` on line `12` to `true` (no quotes) if you'd like members who exceed your parties expectations to be automatically kicked, and set it to `false` (no quotes) if you'd not like members to be automatically kicked.
10. Set the variable `DISABLE_IN_TAVERN` on line `13` to `true` (no quotes) if you'd like members who exceed your parties expectations but are in the tavern to be overriden. Set this to `false` (no quotes) if you don't want this feature. (NOTE: It is recommended that, if you set `AUTO_KICK` to `true`, that you set this to `true` as well.)
11. Use ⌘ + S to save your project, or click the save button ![save button](https://snipboard.io/DStH86.jpg).
12. Near the menu with the run button and debug button, set the function to run to the function `validate` ![image of menu](https://snipboard.io/89PImF.jpg).
13. Click the run button ![run button](https://snipboard.io/UCAtuH.jpg).
14. If you see message that begins with an `ERROR: `, check what the message is saying and try to fix the values of the variables from lines 4-13; fix this before you continue, and if you can't fix it, DM [me](https://habitica.com/profile/7748a67a-a485-4808-91d7-fdba18d6075b) and I'll try to help you. If you don't see any messages, you're good to go! Continue with the next step without changing anything.
15. Navigate to the side menu ![side menu](https://snipboard.io/8fgDPl.jpg), and click on the trigger icon ![trigger icon](https://snipboard.io/Ujx9fg.jpg).
16. Click on the add trigger button ![add trigger button](https://snipboard.io/lVaiCL.jpg) in the bottom right corner.
17. Set the 'Choose which function to run' prompt to `triggerThis`.
18. Set the 'Choose which deployment should run' prompt to `Head`.
19. Set the 'Select event source' prompt to `Time-driven`.
20. Set the 'Select type of time based trigger' prompt to `Day timer`.
21. Set the 'Select time of day' to whatever interval of time you'd like to be messages at. (I recommend `9am to 10am`.)
22. Verify that you're screen looks something like this: ![example](https://snipboard.io/PbaCck.jpg)
23. Click the save button. ![save button](https://snipboard.io/UseTxZ.jpg).

## Troubleshooting:

If you need help with the installation, re-read the steps a couple times. If you can't figure it out, please DM [me](https://habitica.com/profile/7748a67a-a485-4808-91d7-fdba18d6075b).

If you need any help with other problems, first check back to your script triggers and view the error rate. If errors are occuring, try to see what is causing the errors and how you can fix it. If you still are having trouble, please DM [me](https://habitica.com/profile/7748a67a-a485-4808-91d7-fdba18d6075).

If you need help with something else, please DM [me](https://habitica.com/profile/7748a67a-a485-4808-91d7-fdba18d6075).

## Acknowledgements:
* [@Polyglottericus](https://habitica.com/profile/128c50f0-3f5c-47aa-94b9-f293a4920d0f) for the idea and help with testing

## Known Errors:
None! 
