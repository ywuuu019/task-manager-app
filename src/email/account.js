const { SESv2Client, SendEmailCommand } = require("@aws-sdk/client-sesv2");
require("dotenv").config();

const SendWelcomeEmail = async (email, name) => {
  try {
    const client = new SESv2Client({ region: "ap-northeast-1" });

    const input = {
      FromEmailAddress: "taskApp@allmight.today",
      FromEmailAddressIdentityArn: process.env.EMAIL_ARN,
      Destination: {
        ToAddresses: [email],
      },
      Content: {
        Simple: {
          Subject: {
            Data: "Thanks for joining in!", // required
          },
          Body: {
            Text: {
              Data: `Welcome to the app ${name}`, // required
            },
            //   Html: {
            //     Data: 'This message body contains HTML formatting. It can, for example, contain links like this one: <a class="ulink" href="http://docs.aws.amazon.com/ses/latest/DeveloperGuide" target="_blank">Amazon SES Developer Guide</a>.',
            //     Charset: "UTF-8",
            //   },
          },
        },
      },
    };
    const command = new SendEmailCommand(input);
    const response = await client.send(command);
  } catch (e) {
    throw new Error(e);
  }
};

const SendCancelationEmail = async (email, name) => {
  try {
    const client = new SESv2Client({ region: "ap-northeast-1" });

    const input = {
      FromEmailAddress: "taskApp@allmight.today",
      FromEmailAddressIdentityArn: process.env.EMAIL_ARN,
      Destination: {
        ToAddresses: [email],
      },
      Content: {
        Simple: {
          Subject: {
            Data: "See you next time!", // required
          },
          Body: {
            Text: {
              Data: `Goodbye ${name}, I hope to see you back sometime soon.`, // required
            },
            //   Html: {
            //     Data: 'This message body contains HTML formatting. It can, for example, contain links like this one: <a class="ulink" href="http://docs.aws.amazon.com/ses/latest/DeveloperGuide" target="_blank">Amazon SES Developer Guide</a>.',
            //     Charset: "UTF-8",
            //   },
          },
        },
      },
    };
    const command = new SendEmailCommand(input);
    const response = await client.send(command);
    return response;
  } catch (e) {
    throw new Error(e);
  }
};

module.exports = {
  SendWelcomeEmail,
  SendCancelationEmail,
};
