# ActiveRecord

Base class for any model.

The `ActiveRecord` class is a lightweight ORM (Object Relational Mapping) framework that provides an easy way to map database records to JavaScript objects. It follows the Active Record design pattern.

## Usage

To use the `ActiveRecord` class, you should extend it and define the `__primaryKey` static property with an array of properties that are considered unique. You can also set the `__timestamp` static property to true if you want to include timestamp fields like createdAt and updatedAt.

```javascript
import ActiveRecord from '@keonnie/active-record'

export default class MyModel extends ActiveRecord {
  static __primaryKey = ['id']
  static __timestamp = true

  // Properties and methods specific to your model
}
```

**Note**: The `__primaryKey` static property should be set to an array of properties that are considered unique, a string for a single primary key, or `null` if no primary key should be used. If you have a composite primary key, set `__primaryKey` to an array of key properties.

## Creating a new record

To create a new record, you can use the `create` static method, which creates a new instance of your model and saves it to the database.

```javascript
const myModel = await MyModel.create({
  /* properties */
})
```

## Finding record

To find a record, you can use the `find` static method, which searches for records that match the specified arguments and return the first record matching.

```javascript
const myModel = await MyModel.find({
  /* arguments */
})
```

## Creating or finding a record

To create a new record if it doesn't already exist or find the first record that matches the specified query, you can use the `first_or_create` static method.

```javascript
const myModel = await MyModel.first_or_create(
  {
    /* query */
  },
  {
    /* update */
  },
)
```

**Note**: Before a model is saved, its properties are validated using the model's setter. If any of the data is invalid, the validator will throw an error, preventing the model from being saved with invalid data. This ensures that only valid data is saved to the database.

## Instance methods

Your model instances inherit the `save` method, which you can use to save changes to the database.

```javascript
myModel.property = 'new value'
await myModel.save()
```
