#!/bin/bash

# Set up colors.
if tty -s;then
  RED=${RED:-$(tput setaf 1)}
  GREEN=${GREEN:-$(tput setaf 2)}
  YLW=${YLW:-$(tput setaf 3)}
  BLUE=${BLUE:-$(tput setaf 4)}
  RESET=${RESET:-$(tput sgr0)}
else
  RED=
  GREEN=
  YLW=
  BLUE=
  RESET=
fi

# Date
today () {
  TZ=America/Los_Angeles date +'%Y-%m-%d'
}

# Timestamp.
now () {
  date +'%H:%M:%S'
}

# Logging functions instead of echo.
log () {
  printf "${BLUE}`now`${RESET} ${1}\n"
}

info () {
  log "${GREEN}INFO${RESET}: ${1}"
}

warn () {
  log "${YLW}WARN${RESET}: ${1}"
}

critical () {
  log "${RED}CRIT${RESET}: ${1}"
}

#
# Creates a folder at a given path.
# @param $1
#  The name of the target folder.
# @param $2
#  The parent directory, defaults to the current directory.
#
create_folder () {
  folder=$1;
  parent=${2-'.'};

  if ! test -d $parent/$folder; then
   mkdir -p $parent/$folder;
  else
   warn "Folder '$folder' already exists.";
  fi
}

#
# Prompts the user for input.
# @param $1
#  The prompt message.
#
prompt_yes_or_no () {
  question=$1;

  read -p "$question ([y]es or [n]o): " choice;
  case "$choice" in
    [yY][eE][sS]|[yY]) true;;
    [nN][oO]|[nN]) false;;
    *) echo "Invalid response."; prompt_yes_or_no;;
  esac
}

#
# Escapes all special characters.
#
sed_escape () {
  escaped_value=$(echo $1 | sed -e 's/[\/&]/\\&/g');
  echo $escaped_value;
}

#
# Saves a variable to a file.
# @param $1
#  The name of the variable.
# @param $2
#  The value of the variable.
# @param $3
#  The file to reference.
# @param $4
#  Whether to force the update/creation.
#
save_variable () {
  variable=$1
  value=$2
  file=$3

  if [ -z "$variable" ] || [ -z "$value" ] || [ -z "$file" ]; then
    warn "The function 'save_variable' expects 3 params (variable, value and file)."
    return;
  fi

  original_value=$(read_variable "${variable}" "${file}");
  if [ -z "${original_value}" ]; then
    echo "$variable=$value" | tee -a $file > /dev/null
    return;
  else
    sed -i '' "s/^$(sed_escape "${variable}")=.*/$(sed_escape "${variable}")=$(sed_escape "${value}")/" "${file}"
    return;
  fi
}

#
# Reads a variable from a file.
# @param $1
#  The name of the variable.
# @param $2
#  The file to reference.
#
read_variable () {
  variable=$1
  file=$2

  if [ -z "$variable" ] || [ -z "$file" ]; then
    warn "The function 'read_variable' expects 2 params (variable and file)."
    return;
  fi

  value=$(sed -n "s/^${variable}=\(.*\)/\1/p" "${file}");
  echo $value;
  return;
}

# Run ASCII animation
# @param $1
#  The directory which holds the animation files.
# @param $2
#  Indicates the end of the animation and resets the lines.
function ascii_anim() {
  dir=$1
  end=${2:-false}
  sleep=0.1;
  tlines=$(wc -l < $(find $dir -type f | head -n 1))
  files=$dir/*

  for f in $files
  do
    tput cub $columns
    cat $f
    sleep $sleep
    tput cuu $tlines
  done

  if [ $end = true ] ; then
    tput cud $tlines
    echo ""
  fi
}
