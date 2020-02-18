# Web UI Interface

Be aware that the master branch is not fully functional. It was branched from https://github.com/bittorrent/webui which was broken as fuck.

Things fixed/changed:

* added a build.sh to generate webui.zip, loosely based off build script from [afool622's material design webui](https://github.com/afool622/webui). Make a backup of your webui.zip and run it via WSL
* merged [updated DOM file PR by deepak1556](https://github.com/bittorrent/webui/pull/12)
* now able to load webui without it crashing
* fixed language issues on load
* fixed settings dialog not loading
* fixed broken styling for settings dialog
* fixed settings dialog remote panel not showing up
* fixed settings dialog remote panel showing wrong text
* fixed a bunch of incorrectly named translation keys
* fixed add label dialog
* removed use of jquery library because its not imported
* fixed rss dialog functionality
* added back in "Torrent delete dialog"
* fixed mismatched ids in tabs.js
* fixed incorrectly named overlay/cover

There's more to come if I can be bothered, but at least this is a working branch.
