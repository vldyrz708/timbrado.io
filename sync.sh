#!/bin/bash
TARGET='/www'
SOURCE='./dist'
lftp -f "
open hosting1.qrsof.com
user xxx yyy
lcd $SOURCE
mirror --reverse --delete --ignore-time --verbose . $TARGET
bye
"
