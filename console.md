console.txt

| Method             | Description                                                                  |
| ------------------ | ---------------------------------------------------------------------------- |
| `console.log()`    | Standard output for general logging. |
| `console.info()`   | Same as `log()`, meant for informational messages.|
| `console.warn()`   | Outputs a warning (often yellow in console).|
| `console.error()`  | Outputs an error (often red in console).|
| `console.debug()`  | Similar to `log()`, intended for debugging (may be filtered out by default).|
| `console.trace()`  | Prints a stack trace at the current location.         |
| `console.dir(obj)` | Inspects and prints an object with full detail (use `{ depth, colors }`).|




| Method                      | Description                                          |
| --------------------------- | ---------------------------------------------------- |
| `console.time(label)`       | Starts a timer with a given label.                   |
| `console.timeEnd(label)`    | Ends the timer and logs the elapsed time.            |
| `console.timeLog(label)`    | Logs the current time for an ongoing timer.          |
| `console.count(label)`      | Logs how many times it has been called with a label. |
| `console.countReset(label)` | Resets the count for the given label.                |


| Method                     | Description                                 |
| -------------------------- | ------------------------------------------- |
| `console.group(label)`     | Starts a collapsible group of logs.         |
| `console.groupCollapsed()` | Starts a collapsed group (can be expanded). |
| `console.groupEnd()`       | Ends the current group.                     |



| Method                               | Description                              |
| ------------------------------------ | ---------------------------------------- |
| `console.assert(condition, ...data)` | Logs an error if the condition is false. |



| Method            | Description                                         |
| ----------------- | --------------------------------------------------- |
| `console.clear()` | Clears the console (may not work in all terminals). |




| Method               | Description                                                         |
| -------------------- | ------------------------------------------------------------------- |
| `console.table(obj)` | Displays tabular data in a table format (great for arrays/objects). |
