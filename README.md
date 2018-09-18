Tableau Recipes 
===============

This plugin is an extension for Lando and includes custom Tableau recipes for 
use with Lando, including customized tooling:
  - Caboose
  - Db-import
  - Deploy
  - Site-aliasing
  
Installation
------------
Add the following repository information to your app composer.json file

```json
...
"repositories": [
  {
    "type": "vcs",
    "url": "git@github.com:tableau-mkt/lando-plugin-tableau-recipes.git",
    "no-api": true
  }
],
...
```  

```bash
composer require tableau-mkt/tableau-recipes:dev-master
```  

Setting up X-debug in PhpStorm
------------------------------
__Configuring your IDE__
In your IDE, go to Languages & Frameworks > PHP > Debug

![image](https://user-images.githubusercontent.com/8611594/38646710-e8e842c2-3d9d-11e8-880a-41f145e3c79b.png)

Temporarily set your debug connection to "Break at first line in PHP scripts"

__Setting up your path mappings.__
Start listening for PHP debug connections and navigate to http://lando.tableau.com. If your Xdebug is
working correctly it will prompt you in PhpStorm. Make sure your /app is correctly mapped to your directory
and web to /app/web

![image](https://user-images.githubusercontent.com/8611594/38646711-ea574b08-3d9d-11e8-9aa0-54af278823b4.png)

### Useful Commands

```bash
# List all available Lando commands for this app
lando

# Start my site
lando start

# Stop my site
lando stop

# Restart my site
lando restart
# Get important connection info
lando info

# Other helpful things
# Rebuild all containers and build process steps
lando rebuild
# Rebuild one or multiple container
lando rebuild -s appserver -s cache

# Destroy the containers and tools for this app
lando destroy
# Get info on Lando service logs
lando logs
# Specifically see logs on the appserver
lando logs -s appserver
# Get a publicly accessible URL. Run Lando info to get the proper localhost address
lando share -u http://localhost:32813
# "SSH" into the appserver
lando ssh

# Run help to get more info
lando ssh -- --help
```

### Development commands

```bash
# Run composer things
lando composer install
lando composer update

# Run php things
lando php -v
lando php -i

# Turn x-debug on/off completely
lando xdebug off # Useful when you are not actively developing as it improves performance.
lando xdebug on

# Run drush commands
lando drush status
lando drush cr

# Run drupal console commands
lando drupal
```

### Site aliasing
Thanks to the local DNS we have set up (/lando/install/install.sh) we can use 
an infinite amount of subdomains on our site. Site aliases allows us to reserve
a specific subdomain and have it point to a different database. 

:butwhy: Sometimes
your db contains data specific to your dev work, and you don't want to caboose 
over it. However, you need to review someone else's code locally and need a 
fresh db.

Here's what you do:

- `git checkout mybranch`
- Create a new site-alias `lando site-create --alias=review`
- Caboose into your new database `lando caboose --database=review`
- Navigate to your site-alias `http://review.lando.tableau.com`

All site alias commands:

```
# List available site aliases
lando sites

# Set up a new site alias
lando site-create

# Delet an existing site alias
lando site-delete
```

### Testing commands

Lint your PHP code
```bash
lando phplint
```

PHP Code Standards
```bash
# Run phpcs commands
lando phpcs
# Check drupal code standards
lando phpcs --config-set installed_paths /app/vendor/drupal/coder/coder_sniffer
lando phpcs -n --report=full --standard=Drupal --ignore=*.tpl.php --extensions=install,module,php,inc web/modules web/themes web/profiles
```

PHP Unit Tests
```bash
# Run phpunit commands
# replace web if you've moved your webroot to a difference subdirectory
cd web
lando phpunit
# Run some phpunit tests
lando phpunit -c core --testsuite unit --exclude-group Composer
```

PHP Behat Tests
```bash
# Run behat commands
lando behat
# Run some behat tests
lando behat --config=/app/tests/behat-pantheon.yml
```

End-to-end Cypress Tests
```bash
# Run cypress commands
lando cypress
# Run some cypress tests
lando ssh cypress -c "cd /app/tests/end-to-end && cypress run"
```

### Pantheon commands

Terminus
```bash
# List terminus commands.
lando terminus list
# If you have any trouble with the terminus automatically logging in with your environment variable, try this
lando terminus auth:login --machine-token=ABCDEFGHIJKLMNOPQRST
```

Caboose - download the database and files from Pantheon
```bash
# You have a few flags you can pass in to caboose
# -e, --env allows you to choose from which Pantheon environment to pull from
# -f, --files (incredibly optional and not recommended) grab the files folder from the environment specified (default is none)
# -d, --database allows you to import the data into a specific db - defaults to `pantheon`
# --force always download a fresh backup from Pantheon - even if a copy is already present locally
# The following specifies a different database.
lando caboose --env=test --database=target_db --file=none
```

Import - import an existing backup into a specific database
```bash
# You have a few flags you can pass in to import
# -f, --file path to the database backup file (e.g. database/backups/my_backup.sql.gz)
# -d, --database allows you to import the data into a specific db - defaults to `pantheon`
lando import --file=database/backups/mybackup.sql.gz --database=target_db
```

Push up code changes to Pantheon
```bash
# Deploy changes to Pantheon
# -e, --env is the target branch on Pantheon
# --force allows you to push up to reserved branches.
lando deploy --env=master --force
```

###  Advanced commands.

```bash
# Redis CLI.
lando redis-cli
# Varnish admin.
lando varnishadm
```

### Useful Docs

We're using the `/.env` file to override specific environment variables. Do not override in the `~/.lando` config
as it will get overwritten on upgrade.

More information [here](https://docs.devwithlando.io/config/env.html).
