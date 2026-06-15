# Mux Data Dashboards and Filtering

Reference for building custom dashboards in Mux Data, including component types, dashboard configuration, time periods, and filtering capabilities. Covers filter syntax for the API and filter sets for saving and sharing filter combinations.

## Custom Dashboards Overview

Custom dashboards provide a centralized view of your video performance data through configurable components. You can create dashboards with multiple visualization types, apply filters, and customize time periods to focus on specific aspects of your video performance.

### Key Features

- Four component types: Timeseries, Bar charts, Lists, and Metric numbers
- 10 components per dashboard maximum
- Dashboard and component-level filtering
- Flexible time period selection
- Comparison intervals
- Dashboard sharing and duplication

**Note:** Custom Dashboards are available on Mux Data Media plans. Custom Dashboards are currently only available for the standard 100 days of data; Long-term Metrics are not yet available with Custom Dashboards.

## Creating a Dashboard

1. Navigate to the **Dashboards** section in Mux Data
2. Select **Create Dashboard** from the left menu or main window
3. Enter a descriptive name for your dashboard
4. Select **Create Dashboard**

## Dashboard Configuration

### Time Periods

Configure the time period for your entire dashboard to focus on specific date ranges:

| Option | Description |
|--------|-------------|
| Default | Last 24 hours |
| Relative periods | Predefined options like last 7 days or last 30 days |
| Specific periods | Exact start and end dates for consistent historical analysis |

Time period changes apply to all dashboard components. Save your dashboard to preserve time period settings.

### Dashboard Filters

Dashboard filters apply to all components within the dashboard, providing consistent data filtering across visualizations.

#### Dimension Filters

Filter by dimension values such as country, operating system, or player version:

1. Select the **Filter Dimensions** button
2. Search for and select the dimension type
3. Choose specific values to include or exclude
4. Multiple values use OR logic (e.g., selecting iOS and Android shows views from either platform)

#### Metric Filters

Filter by metric values to focus on specific performance thresholds:

1. Select the **Filter Metrics** button
2. Choose a metric (e.g., rebuffering percentage)
3. Select an operator (less than or equal to, greater than or equal to, equals, etc.)
4. Set the value threshold

Filter changes can be previewed without saving. Click **Save** at the bottom of the dashboard to apply filters permanently.

### Component Filters

Components can have their own filters in addition to dashboard filters. Dashboard filters act as parent filters affecting all components. Component-level filters are additive to dashboard filters but only apply to the component.

**Important:** If dashboard and component filters conflict, the component may show no data. Ensure filter combinations are logical and compatible.

## Dashboard Components

Components visualize individual metrics within your dashboard. Each component type serves different analytical purposes and can be customized with specific filters and options.

- To add a component to a new dashboard, select the **Create Component** button
- To add a component to an existing dashboard, select the **Edit Icon** next to the date selector

### Metric Numbers

Display key performance indicators in a prominent metrics bar at the top of your dashboard. Up to 5 Metric numbers can be added per dashboard. Metric numbers (up to 5) collectively count as 1 component.

**Configuration:**

1. Select **Metric Number** as the component type
2. Choose the metric to display
3. Provide a descriptive name (50 character limit)
4. **Optional:** Add a comparison time period to show rate of change
5. **Optional:** Apply component-specific dimension or metric filters

**Note:** Metric number components appear in creation order and cannot be reordered.

### Timeseries

Track metrics over time to identify trends, patterns, and anomalies in your video performance.

**Configuration:**

1. Select **Timeseries** as the component type
2. Choose the metric to chart over time
3. Set a descriptive component name
4. Select component size (half or full width)
5. **Optional:** Choose either:
   - **Comparison interval:** Compare current period with a previous timeframe
   - **Breakdown values:** Chart multiple values for a single dimension type (e.g., different device types)
6. **Optional:** Apply component-specific filters

**Note:** Comparison intervals and breakdown values are mutually exclusive options. Breakdown dimensions will take priority over dashboard and component filters of the same dimension.

### Bars

Compare performance across different dimension values using horizontal bars.

**Configuration:**

1. Select **Bars** as the component type
2. Choose the metric to measure in the bars visualization
3. Select component size (half or full width)
4. Choose breakdown dimension type and values that you wish to display
5. **Optional:** Add a comparison interval to compare current period with a previous timeframe
6. **Optional:** Apply component-specific filters

**Note:** Breakdown values must come from a single dimension category.

### Lists

Rank and organize data to quickly identify top performers or problem areas.

**Configuration:**

1. Select **List** as the component type
2. Choose the metric to measure for each list item
3. Select the dimension to list (e.g., player names, video titles)
4. Set sort order (ascending or descending)
5. Specify the number of items to display in the list component
6. Provide a descriptive component name
7. **Optional:** Add a comparison interval
8. **Optional:** Apply component-specific filters

**Note:** Lists are only available in half-width size.

## Dashboard Management

### Sharing Dashboards

When creating a new dashboard, you can choose to share it with everyone in your environment. Public dashboards appear in the Shared folder for all users in your environment. You can change the sharing level at any time from the More Options dropdown.

All users can view public dashboards. To save an editable version of a public dashboard, create a duplicate.

### Sharing via Dashboard Link

Any dashboard can be shared with users who have access to your Mux environment via the dashboard link, even if it is not marked as public. Users who receive a link can:

- View the dashboard
- Favorite it to save it to their personal list
- Create a duplicate to make their own editable copy

### Editing Dashboard Permissions

Users have the ability to edit dashboards they are the owner of but do not have the ability to edit public dashboards they do not own. Admins have full editing abilities for all dashboards.

### Favoriting Dashboards

Favorite personal or shared dashboards to allow quick access to your most frequently used dashboards. You can have up to 20 favorited dashboards across your environments.

Favorite a dashboard by pressing the favoriting star in the dashboard menu. When a dashboard is favorited, the star will be highlighted and the dashboard will be added to the top of the custom dashboard navigation sidebar in the favorites section.

### Saving Dashboard Copies

Save a modified version without affecting the original:

1. Make your desired changes to the dashboard
2. Use the **Save As** option in the save menu
3. Provide a new name for the copy

### Exporting Dashboards

Export a dashboard to a PDF to save a snapshot of your dashboard:

1. Select the **More Options** menu (three dots) next to the favorite button
2. Choose **Export PDF**

### Duplicating Dashboards

Create an exact copy of an existing dashboard:

1. Select the **More Options** menu (three dots) next to the favorite button
2. Choose **Duplicate**

**Note:** Duplication is not available while a dashboard is being edited.

### Deleting Dashboards

Permanently remove dashboards you no longer need:

1. Select the **More Options** menu (three dots) next to the favorite button
2. Choose **Delete**
3. Confirm the deletion

**Warning:** Deleting a dashboard removes it for all users. Duplicate dashboards are not affected.

### Exploring Metric Details

Access detailed metric analysis directly from dashboard components:

1. Select the **Go To Metrics** icon on any component
2. The metrics page opens with:
   - Selected filters from your dashboard applied
   - The component's metric pre-selected

---

## API Filter Syntax

The `filters[]` parameter allows you to filter your data using flexible syntax that supports different types of operations depending on the dimension type.

### Filter Syntax Overview

The basic format for all filters is:

```
filters[]=<operation><dimension>:<value>
```

| Component | Description | Examples |
|-----------|-------------|----------|
| `<operation>` | Optional prefix defining the filter type | (none) = equals, `!` = not equals, `+` = set contains, `-` = set omits |
| `<dimension>` | The field or metric to filter on | `country`, `operating_system`, `video_cdn_trace` |
| `:` | Separator between dimension and value | - |
| `<value>` | The value to compare against | Scalar: `US`, `windows`; Trace: `[fastly,akamai]}` |

### Supported Operations

#### Scalar Operations

Scalar operations can be used with single-value dimensions or simple key-value pairs. Use these operations when you want to filter by an exact match or exclusion.

| Syntax | Operation | Example | Description |
|--------|-----------|---------|-------------|
| `dimension:value` | Equals | `filters[]=country:US` | Field equals value |
| `!dimension:value` | Not equals | `filters[]=!operating_system:windows` | Field does not equal value |

#### Set Operations

Use for trace dimensions that can have multiple values in an ordered list. Use these operations when you want to check if a single value appears in the trace dimension.

| Syntax | Operation | Example | Description |
|--------|-----------|---------|-------------|
| `+dimension:value` | Has | `filters[]=+video_cdn_trace:fastly` | Set contains value |
| `-dimension:value` | Omits | `filters[]=-video_cdn_trace:cloudflare` | Set does NOT contain value |

**Note:** Set operations cannot be used as a wildcard for substring searches. For example, `filters[]=+video_cdn_trace:fas` cannot be used to return views with CDN traces that contain `fastly`.

#### Trace Operations

Use for trace dimensions that can have multiple values in an ordered list. Use this operation when you want to filter for an exact, ordered match.

| Syntax | Operation | Example | Description |
|--------|-----------|---------|-------------|
| `dimension:[value1,value2]` | Equals | `filters[]=video_cdn_trace:[fastly,akamai]` | Trace equals exactly `[fastly, akamai]` |

### Practical Examples

#### Scalar (Basic) Operations

Filter for views from the US:

```
filters[]=country:US
```

Exclude mobile operating systems:

```
filters[]=!operating_system:mobile
```

#### Set Operations

Find views with 'fastly' as a CDN value in the video_cdn_trace dimension:

```
filters[]=+video_cdn_trace:fastly
```

Exclude views that went through cloudflare:

```
filters[]=-video_cdn_trace:cloudflare
```

#### Trace Operations

Find views that went through exactly fastly first, then akamai:

```
filters[]=video_cdn_trace:[fastly,akamai]
```

Find views where no CDN value was set:

```
filters[]=video_cdn_trace:[]
```

### Multiple Filters

You can combine multiple filters.

**Filters with different dimensions:**

When you are combining filters with different dimensions they are combined with AND.

```
# Views from US AND went through fastly
filters[]=country:US
filters[]=+video_cdn_trace:fastly
```

You can also combine dimensions with the same dimension. These are combined with OR.

```
# Views from US OR Canada
filters[]=country:US
filters[]=country:CA
```

However, if you are combining filters with the same dimension value with a negated value, those are combined using AND.

```
# Views NOT from US AND NOT from Canada
filters[]=!country:US
filters[]=!country:CA
```

### Value Formatting

| Type | Format | Example |
|------|--------|---------|
| Scalar (basic) values | Plain strings | `country:US` |
| Trace values | Comma-separated values in brackets | `video_cdn_trace:[a,b,c]` |
| Empty traces | Empty brackets | `video_cdn_trace:[]` |

### Common Errors

**Do not use brackets with set operators:**

```
# Invalid
filters[]=+video_cdn_trace:[fastly]

# Valid
filters[]=+video_cdn_trace:fastly
```

**Do not use scalar operator syntax with trace dimensions:**

```
# Invalid
filters[]=video_cdn_trace:fastly

# Valid - Exact match
filters[]=video_cdn_trace:[fastly]

# Valid - Contains check
filters[]=+video_cdn_trace:fastly
```

### URL Encoding

When using filters in URLs, remember to properly encode the parameters:

```bash
# Single filter
/metrics?filters[]=country:US

# Multiple filters
/metrics?filters[]=country:US&filters[]=+tags:beta&filters[]=video_cdn_trace:[fastly,akamai]

# URL encoded
/metrics?filters%5B%5D=country%3AUS&filters%5B%5D=%2Btags%3Abeta&filters%5B%5D=video_cdn_trace%3A%5Bfastly%2Cakamai%5D
```

Example JavaScript for URL encoding filter params:

```javascript
// Example filters
const filters = [
  "country:US",
  "+tags:beta",
  "video_cdn_trace:[fastly,akamai]"
];

// Use URLSearchParams to build query string
const params = new URLSearchParams();
filters.forEach(f => params.append("filters[]", f));

// Full URL
const url = `/metrics?${params.toString()}`;

console.log(url);
// /metrics?filters%5B%5D=country%3AUS&filters%5B%5D=%2Btags%3Abeta&filters%5B%5D=video_cdn_trace%3A%5Bfastly%2Cakamai%5D
```

### Common Use Cases

#### Analytics and Debugging

Find problematic CDN paths:

```
# Views that went through cloudflare but not fastly
filters[]=-video_cdn_trace:fastly
filters[]=+video_cdn_trace:cloudflare
```

Debug specific video delivery paths:

```
# Exact CDN sequence analysis
filters[]=video_cdn_trace:[fastly,akamai,cloudfront]
```

#### Performance Analysis

High-performance regions:

```
# Exclude slow CDN providers
filters[]=-video_cdn_trace:slow-cdn
filters[]=!operating_system:legacy
```

Mobile vs Desktop comparison:

```
# Mobile traffic analysis
filters[]=operating_system:ios
filters[]=operating_system:android
```

#### Content Filtering

Live vs VOD content:

```
# Exclude recorded content
filters[]=!content_type:recorded
filters[]=content_type:live
```

Platform-specific analysis:

```
# Web platform only, excluding mobile apps
filters[]=platform:web
filters[]=!platform:ios
filters[]=!platform:android
```

### Error Handling

The API will return validation errors for:

- Invalid dimension names
- Incorrect operator usage for dimension type
- Malformed values (e.g., mismatched brackets, quotes)
- Invalid operator combinations (e.g., `!+dimension:value`)

Example error response:

```json
{
  "error": "Sequence dimensions require bracket notation. Use video_cdn_trace:[value] instead of video_cdn_trace:value"
}
```

### Testing Your Filters

To ensure your filters are working as expected, it can be helpful to limit the dataset you are working with. Test your filters with a small date range first:

```bash
/metrics?timeframe[]=24:hours&filters[]=country:US&filters[]=+video_cdn_trace:akamai
```

---

## Filter Sets

Filter sets allow you to save and share commonly used filter combinations to ensure data consistency and streamline operational workflows.

### Creating a Filter Set

1. Select the filter set button on any dashboard that supports filters
2. Select 'create new filter set' from the menu
3. Select a name for your filter set
4. Choose if your filter set is public or private:
   - **Private:** Only you will see it in the menu under your 'private' filter sets
   - **Public:** All users in an environment will be able to see and select the filter set
5. Select the filters to add to your filter set (filter values selected on the page will automatically populate)
6. You can remove or add new dimension and metric filters before saving

### Adding New Filter Values

You can manually create a new filter value if it does not yet exist in Mux Data. This is useful for an upcoming event or new product launch.

1. In the filter menu, select the dimension type on the left
2. Type the value of the dimension that you wish to add
3. The value you entered will appear in the results with zero views
4. Select that value to add it to your filter set
5. Select apply
6. Select save

This value will now be associated with your saved filter set. When selecting this filter set, it will show zero views until there are views that match that criteria.

### Navigating with Filter Sets

When a filter set is selected, it will persist when navigating across dashboards in Mux Data. Not all filters are supported across all dashboards.

If you navigate to a dashboard that does not support a filter in your selected filter set, that filter will be deactivated while on that dashboard. A warning message will appear and the filter set will appear yellow if all values are not applicable to that page. The filter will also appear in a deactivated state in the filter display menu.

Once you navigate to a dashboard where that filter is applicable, it will be reactivated.

### Filter Sets and Custom Dashboards

When you build a Custom Dashboard, filters and filter sets are saved as a setting of that dashboard. When you navigate to a Custom Dashboard, all selected filters and filter sets will be reset to the values saved to that dashboard.

Filter sets can be added to custom dashboards. However, filter sets are not available to be applied to custom dashboard components.

### Deleting a Filter Set

1. Select the edit filter set icon for the filter set you wish to delete
2. In the filter set menu, select delete filter set icon
