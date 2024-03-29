import React from "react";
import { render } from "react-dom";
import { types, applySnapshot } from "mobx-state-tree";
import { observer } from "mobx-react-lite";
import { values } from "mobx";

const randomId = () => Math.floor(Math.random() * 1000).toString(36);

const Todo = types
  .model({
    name: types.optional(types.string, ""),
    done: types.optional(types.boolean, false),
    user: types.maybe(types.reference(types.late(() => User)))
  })
  .actions(self => {
    function setName(newName) {
      self.name = newName;
    }
    function setUser(user) {
      if (user === "") {
        // When selected value is empty, set as undefined
        self.user = undefined;
      } else {
        self.user = user;
      }
    }
    function toggle() {
      self.done = !self.done;
    }

    return { setName, setUser, toggle };
  });

const User = types.model({
  id: types.identifier,
  name: types.optional(types.string, "")
});

const RootStore = types
  .model({
    users: types.map(User),
    todos: types.map(Todo)
  })
  .views(self => ({
    get pendingCount() {
      return values(self.todos).filter(todo => !todo.done).length;
    },
    get completedCount() {
      return values(self.todos).filter(todo => todo.done).length;
    },
    getTodosWhereDoneIs(done) {
      return values(self.todos).filter(todo => todo.done === done);
    }
  }))
  .actions(self => {
    function addTodo(id, name) {
      self.todos.set(id, Todo.create({ name }));
    }

    return { addTodo };
  });

const store = RootStore.create({
  users: {
    "1": {
      id: "1",
      name: "mweststrate"
    },
    "2": {
      id: "2",
      name: "mattiamanzati"
    },
    "3": {
      id: "3",
      name: "johndoe"
    }
  },
  todos: {
    "1": {
      name: "Eat a cake",
      done: true
    }
  }
});

const UserPickerView = observer(props => (
  <select
    value={props.user ? props.user.id : ""}
    onChange={e => props.onChange(e.target.value)}
  >
    <option value="">-none-</option>
    {values(props.store.users).map(user => (
      <option value={user.id}>{user.name}</option>
    ))}
  </select>
));

const TodoView = observer(props => (
  <div>
    <input
      type="checkbox"
      checked={props.todo.done}
      onChange={e => props.todo.toggle()}
    />
    <input
      type="text"
      value={props.todo.name}
      onChange={e => props.todo.setName(e.target.value)}
    />
    <UserPickerView
      user={props.todo.user}
      store={props.store}
      onChange={userId => props.todo.setUser(userId)}
    />
  </div>
));

const TodoCounterView = observer(props => (
  <div>
    {props.store.pendingCount} pending, {props.store.completedCount} completed
  </div>
));

const AppView = observer(props => (
  <div>
    <button onClick={e => props.store.addTodo(randomId(), "New Task")}>
      Add Task
    </button>
    {values(props.store.todos).map(todo => (
      <TodoView store={props.store} todo={todo} />
    ))}
    <TodoCounterView store={props.store} />
  </div>
));

render(<AppView store={store} />, document.getElementById("root"));
