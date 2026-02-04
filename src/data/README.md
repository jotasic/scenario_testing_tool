# Sample Scenario Data

This directory contains sample scenarios for demonstration and testing purposes.

## Sample Scenario: API Test Flow

The sample scenario demonstrates the following features:

### Features Demonstrated

1. **Multiple Servers**
   - `mock_server`: JSONPlaceholder API
   - `api_server`: GitHub API

2. **Parameter Schema**
   - Complex parameter structure with arrays and nested objects
   - Required and optional parameters
   - Default values and validation rules

3. **Request Steps**
   - Variable references in endpoints: `${params.list[0].id}`
   - Different HTTP methods (GET, POST)
   - Request body with variables
   - Response saving and aliasing

4. **Conditional Branching**
   - Response-based conditions
   - Multiple branch paths
   - Default fallback branches

5. **Looping**
   - `forEach` loop over parameter array
   - Nested iteration with `countField`
   - Loop variables: `${loop.index}`, `${loop.item.id}`, `${loop.total}`

6. **Execution Modes**
   - `auto`: Execute immediately
   - `manual`: Wait for user confirmation
   - `delayed`: Wait for specified time before executing

### Sample Parameters

To run the sample scenario, provide parameters in this format:

```json
{
  "list": [
    { "id": 1, "count": 2 },
    { "id": 2, "count": 3 },
    { "id": 3, "count": 1 }
  ],
  "repository": "facebook/react"
}
```

### Flow Description

1. **Get User** (Auto)
   - Fetches user with ID from `list[0].id`
   - Saves response as `user`

2. **Check User Name** (Condition)
   - Branches based on user name length
   - Long names (>15 chars) → Get Posts
   - Short names → Get Todos

3a. **Get User Posts** (Auto)
   - Fetches all posts by the user
   - Saves response as `posts`

3b. **Get User Todos** (Auto)
   - Fetches all todos by the user
   - Saves response as `todos`

4. **Process Each Item** (Loop)
   - Iterates over `params.list`
   - For each item, repeats `item.count` times
   - Total iterations = sum of all count values

5. **Create Post for Item** (Auto, inside loop)
   - Creates a post for each iteration
   - Uses loop variables in request body

6. **Manual Verification** (Manual)
   - Pauses execution
   - Fetches GitHub repository info
   - Requires user to click Resume

7. **Get Repository Stars** (Delayed)
   - Waits 2 seconds before executing
   - Fetches repository stargazers
   - Branches based on star count

8. **Final Summary** (Auto)
   - Gets final user summary
   - Completes execution

### Variable References

The scenario demonstrates various variable reference patterns:

- Parameter access: `${params.list[0].id}`
- Response access: `${responses.user.name}`
- Loop variables: `${loop.index}`, `${loop.item.id}`, `${loop.total}`
- Nested array access: `${params.list[0].count}`

### Testing the Scenario

1. The sample scenario is loaded automatically as initial data
2. Navigate to the execution view
3. Review the default parameters or modify them
4. Click "Start" to begin execution
5. When the manual step is reached, review the results and click "Resume"
6. Watch the execution progress through all steps

### Modifying the Sample

You can modify the sample scenario in `/src/data/sampleScenario.ts` to:
- Add more steps
- Change server configurations
- Add more complex conditions
- Test different loop types
- Experiment with execution modes
