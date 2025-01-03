const express = require("express");
const bodyParser = require("body-parser");
const { graphqlHTTP } = require("express-graphql");
const { buildSchema } = require("graphql");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const Event = require("./models/event");
const User = require("./models/user");

const app = express();
const PORT = 3000;

app.use(bodyParser.json());

app.use("/graphql", graphqlHTTP({
  schema: buildSchema(`
    type Event {
      _id: ID!
      title: String!
      description: String!
      price: Float!
      date: String!
    }

    type User {
      _id: ID!
      email: String!
      password: String!
    }

    input EventInput {
      title: String!
      description: String!
      price: Float!
      date: String!
    }
    
    input UserInput {
      email: String!
      password: String!
    }

    type RootQuery {
      events: [Event!]!
    }

    type RootMutation {
      createEvent(eventInput: EventInput): Event
      createUser(userInput: UserInput): User
    }

    schema {
      query: RootQuery
      mutation: RootMutation
    }
  `),
  rootValue: {
    events: () => {

      return Event.find({}).then(events => {
        return events.map(event => {
          return {
            ...event._doc
          }
        });
      }).catch(err => {
        throw err
      });

    },
    createEvent: args => {

      const event = new Event({
        title: args.eventInput.title,
        description: args.eventInput.description,
        price: +args.eventInput.price,
        date: new Date(args.eventInput.date),
        creator: "676d34a7e7675c4abb68bf51"
      });

      let createdEvent;

      return event
        .save()
        .then(result => {
          createdEvent = {
            ...result._doc,
            _id: result._doc._id.toString()
          };
          return User.findById("676d34a7e7675c4abb68bf51");
        })
        .then(user => {
          if (!user) {
            throw new Error("User not found.");
          }
          user.createdEvents.push(event);
          return user.save();
        })
        .then(result => {
          return createdEvent;
        })
        .catch(err => {
          console.log(err);
          throw err;
        });
    },
    createUser: args => {
      const salt = 12;
      return User
        .findOne({ email: args.userInput.email })
        .then(user => {
          if (user) {
            throw new Error("User exists already.");
          }
          return bcrypt.hash(args.userInput.password, salt)

        }).then(hashedPassword => {
          const user = new User({
            email: args.userInput.email,
            password: hashedPassword
          });
          return user.save();
        }).then(result => {
          return {
            ...result._doc,
            password: null,
            _id: result.id
          }
        })
        .catch(err => {
          throw err;
        });
    }
  },
  graphiql: true
}));

mongoose.connect(
  `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.a4pwb.mongodb.net/${process.env.MONGO_DB}`
).then(
  () => {
    app.listen(PORT, () => console.log(`Server started at http://localhost:${PORT}`));
  }
).catch(
  err => {
    console.log(err);
  }
);
