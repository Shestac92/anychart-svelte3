<script>
  import { afterUpdate } from 'svelte';

  // component props
  export let data;
  export let type;

  // ID of the DIV tag for a chart container
  const container = 'chart-container';

  // variable for a chart instance
  let chart;

  // helper functinon for building a chart with passed type and data
  const createChart = (type, data) => {
    // dispose chart if exists, it is required to change chart type
    if (chart) {
      chart.dispose();
    }

    // create chart with the specified constructor
    chart = anychart[type](data);

    // chart title
    chart.title('Product distribution');

    // configure axes' settings and series name for column/bar chart
    if (type !== 'pie') {
      chart.xAxis().title('Product');
      chart.yAxis().title('Amount');
      chart.getSeries(0).name('Products');
    }

    // enable chart legend and animation
    chart.legend(true);
    chart.animation(true);

    // render the chart to the specified DIV tag
    chart.container(container).draw();
  };

  // recreate chart on props update
  afterUpdate(() => {
    createChart(type, data);
  });
</script>

<div id={container} />

<style>
  div {
    width: 100%;
    height: 60%;
  }
</style>
