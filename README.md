Lando Drupal Tooling 
====================

This plugin is an extension for Lando and includes additional tooling and config for 
use with Lando and Drupal sites:

- Caboose
- Deploy
- DB Import
- Site Aliasing
- X-debug

### Caboose
New tooling command `caboose` to pull database backup and files from Pantheon. Contrary to `pull`
it will not generate a new backup, but use the latest available one.

```bash
# You have a few flags you can pass in to caboose
# --auth allows you to pass a pantheon machine
# -e, --env allows you to choose from which Pantheon environment to pull from
# -f, --files (incredibly optional and not recommended) grab the files folder from the environment specified (default is none)
# -d, --database allows you to import the data into a specific db - defaults to `pantheon`
# --force always download a fresh backup from Pantheon - even if a copy is already present locally
# The following specifies a different database.
lando caboose --env=test --database=target_db --files=none
```

### Deploy
New tooling command `deploy` to push code artifacts up to Pantheon. This is heavily based on
[lando pantheon ci workflow](https://github.com/lando/lando-pantheon-ci-workflow-example) and
requires the [ScriptHandler.php](https://github.com/lando/lando-pantheon-ci-workflow-example/tree/master/scripts/composer)
in your codebase under `scripts/composer`

Add the following to your `composer.json`:

```json
...
  "scripts": {
    "prepare-for-pantheon": "DrupalProject\\composer\\ScriptHandler::prepareForPantheon"
  },
...
```

```bash
# Deploy changes to Pantheon
# --auth allows you to pass a pantheon machine
# -e, --env is the target branch on Pantheon
# -pc, --post-command will run post commands (i.e. all, cr, updb, cim or none).
# --force allows you to push up to reserved branches.
lando deploy --env=master --post-command=all --force
```

### Db-import
New tooling command `import` to import database backup file. Contrary to `db-import` you can
set the target db in the same db container.

```bash
# You have a few flags you can pass in to import
# -f, --file path to the database backup file (e.g. database/backups/my_backup.sql.gz)
# -d, --database allows you to import the data into a specific db - defaults to `pantheon`
lando import --file=database/backups/mybackup.sql.gz --database=target_db
```

### Site aliasing
If you are using a local DNS on your machine you can use this tooling command to
generate an infinite amount of subdomains on your site. Site aliases allows us to reserve
a specific subdomain and have it point to a different database, but use the same codebase.

WHY? Sometimes your db contains data specific to your dev work, and you don't want to caboose 
over it. However, you need to review someone else's code locally and need a 
fresh db.

Here's what you do:

- `git checkout mybranch`
- Create a new site-alias `lando site-create --alias=review`
- Caboose into your new database `lando caboose --database=review`
- Navigate to your site-alias `http://review.domain.lando`

All site alias commands:

```
# List available site aliases
lando sites

# Set up a new site alias
lando site-create

# Delet an existing site alias
lando site-delete
```

### X-debug
Lando now support disabling xdebug completely for your recipes, but this mean you need to completely
rebuild when you want to enable it again. Instead, this tooling command `xdebug` allows you to 
enabled/disable x-debug integration on the fly.

```bash
lando xdebug off # Useful when you are not actively developing as it improves performance.
lando xdebug on
```

### Setting up X-debug in PhpStorm

__Configuring your IDE__
In your IDE, go to Languages & Frameworks > PHP > Debug

![image](https://user-images.githubusercontent.com/8611594/38646710-e8e842c2-3d9d-11e8-880a-41f145e3c79b.png)

Temporarily set your debug connection to "Break at first line in PHP scripts"

__Setting up your path mappings.__
Start listening for PHP debug connections and navigate to http://tableau.lando. If your Xdebug is
working correctly it will prompt you in PhpStorm. Make sure your /app is correctly mapped to your directory
and web to /app/web

![image](https://user-images.githubusercontent.com/8611594/38646711-ea574b08-3d9d-11e8-9aa0-54af278823b4.png)

### Useful Docs
* [Lando + Xdebug + PhpStorm](https://docs.devwithlando.io/guides/lando-phpstorm.html)
* Everything [Lando](https://docs.devwithlando.io).
