# google-sites-slack-notification

[![serverless](http://public.serverless.com/badges/v3.svg)](http://www.serverless.com)


![demo](https://raw.githubusercontent.com/mooyoul/google-sites-slack-notification/master/docs/google-sites-slack-notification.gif)


Receive Slack notification when Google Sites has updated.

This service also supports Service Account, including G Suite domain-wide authority delegation to access private site.

## Limitation

Currently this service only supports **[Classic Google Sites](https://gsuiteupdates.googleblog.com/2016/11/a-totally-rebuilt-google-sitesnow.html)**, since Google Sites Data API does not support [rebuilt Google Site](https://blog.google/products/g-suite/totally-rebuilt-sites-customer-tested/).

See also: [https://developers.google.com/sites/](Google Developers - Google Sites API)   

## Configuration

Please refer [src/config.ts](src/config.ts).

## Deploying service

There's two kinds of service deployment type.

### Serverless deployment (Preferred)

> **NOTE**
> - Currently Serverless deployment only supports AWS Lambda environment.
> - Serverless deployment only supports DynamoDB state store.
> - Preconfigured sync interval is 5 minutes. you can change this by editing cron expression on serverless.yml

[Serverless](https://serverless.com/framework/docs/providers/aws/guide/quick-start/) deployment is preferred since this method does not require additional service management.


```bash
$ git clone https://github.com/mooyoul/google-sites-slack-notification
$ cd google-sites-slack-notification
$ vi src/config.ts # Setup target Google site and DynamoDB Store
$ npm run dynamodb:migrate
$ npm run deploy:prod 
```

That's it!

### old-fashioned deployment

```bash
$ git clone https://github.com/mooyoul/google-sites-slack-notification
$ cd google-sites-slack-notification
$ vi src/config.ts # Setup target Google site and Store (FileStore or DynamoDB)
$ npm start # Execute sync task to test configuration 
```

If sync task was successfully done, add sync task to crontab:

```bash
$ crontab -e
``` 

and add rule:

```
0/5 * * * * cd PROJECT_ROOT && flock -xn /tmp/.google-sites-sync.lock -c npm start
```

## License

[MIT](LICENSE)

See full license on [mooyoul.mit-license.org](http://mooyoul.mit-license.org/)
