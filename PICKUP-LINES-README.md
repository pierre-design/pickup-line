# Managing Pickup Lines

## Overview

The `pickup-lines.txt` file is a simple text file that contains all the pickup lines used in the application. This file makes it easy to update, add, or remove pickup lines without touching the code.

## File Format

- Each line in the file represents one pickup line
- Lines starting with `#` are comments and will be ignored
- Empty lines are ignored
- The order of lines in this file determines their default display order

## How to Update Pickup Lines

1. Open `pickup-lines.txt` in any text editor
2. Edit the pickup lines as needed:
   - To modify a line: Simply edit the text
   - To add a new line: Add a new line of text
   - To remove a line: Delete the entire line
3. Save the file
4. The changes will need to be synced to `src/domain/pickupLines.ts` for the app to use them

## Current Implementation

Currently, the pickup lines are stored in `src/domain/pickupLines.ts`. The `pickup-lines.txt` file serves as a reference and makes it easier to manage the content.

To sync changes from `pickup-lines.txt` to the application:
1. Update the text in `pickup-lines.txt`
2. Update the corresponding entries in `src/domain/pickupLines.ts`

## Future Enhancement

In a future version, the application could automatically read from `pickup-lines.txt` at build time or runtime, eliminating the need for manual syncing.

## Example

```
# Sales Pickup Lines
Hi, I noticed you've been looking at our product. Can I help answer any questions?
Good morning! I'm calling because I think we have a solution that could save you time and money.
```

## Tips

- Keep pickup lines concise and professional
- Test new lines in real calls to gather performance data
- Review the "Your best opening lines" dashboard to see which lines perform best
- Consider A/B testing similar variations to optimize performance
