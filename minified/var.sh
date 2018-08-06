#! /bin/bash

tmp=/tmp/variables.list
file=tmap.min.js
reslist=/tmp/reserve.list
frqlst=/tmp/frequence.list

# alias grep="grep --color=never"
GREP_OPTIONS='--color=never'
grep -Eo "\.([a-zA-Z_0-9]+)" $file > $tmp
grep -Eo "([a-zA-Z_0-9]+)[ \t]*:" $file >> $tmp
grep -Eo "\[['\"][ \t]*[a-zA-Z_0-9]+[ \t]*['\"]\]" $file >> $tmp

sed "s/\.//g;s/ //g;s/	//g;s/://g;s/\[//g;s/\]//g;s/\"//g;s/\'//g;" $tmp | grep -v "^\d" | sort > $frqlst

# wc -l $tmp
egrep -v ^[a-zA-Z0-9]\{1,2\}$ $frqlst | uniq > $tmp
egrep ^[a-zA-Z0-9]\{1,2\}$ $frqlst | uniq > $reslist


