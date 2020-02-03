#!/bin/bash
set -ex

# based off https://github.com/afool622/webui
# https://github.com/psychowood/ng-torrent-ui uses grunt

# Files in root folder
# declare -a rootDir=(constants.js contextmenu.js dialogmanager.js excanvas.js flotr.js guest.html ie.css ie.js ie7.css index.html logger.js main.css main.js mootools.js speedgraph.js stable.css stable.js tabs.js utils.js webui.js)
declare -a rootDir=(*.html *.css *.js LICENSE)
# Files in localization folder
# declare -a locDir=(_.js ar.js be.js bg.js bs.js ca.js cs.js da.js de.js el.js en.js es.js et.js fi.js fr.js fyNL.js ga.js gl.js he.js hu.js is.js it.js ja.js ka.js ko.js lt.js lv.js nl.js nnNO.js no.js pl.js pt.js ptBR.js ro.js ru.js sk.js sl.js sq.js srSR.js sv.js th.js tr.js tw.js uk.js va.js vi.js zhCN.js zhTW.js)
declare -a dirList=(images lang)

if [ -d ./.tmp ]; then
	rm -fR .tmp
fi

mkdir ./.tmp
cp -p *.html *.css *.js LICENSE .tmp/
cp -r images lang .tmp/
cd .tmp

for f in ${rootDir[@]}; do
	if [[ $1 == "-v" ]]; then
		gzip -qvf $f > ./$f.gz
	else
		gzip -qf $f > ./$f.gz
	fi
	# rm $f
done

# for f in ${locDir[@]}; do
for d in ${dirList[@]}; do
	cd $d
	for f in $(ls ./*); do
		if [[ $1 == "-v" ]]; then
			gzip -qvf $f > ./$f.gz
		else
			gzip -qf $f > ./$f.gz
		fi
	done
	cd ../
done

if [[ $1 == "-v" ]]; then
	zip -r -v ../webui.zip ./*
else
	zip -r -q ../webui.zip ./*
fi

cd ../

chmod 0644 ./webui.zip
# cp -fp webui.zip "/Users/$USER/Library/Application Support/BitTorrent/"
rm -R ./.tmp
# rm ./webui.zip
