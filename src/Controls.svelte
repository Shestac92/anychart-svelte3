<script>
import Chart from "./Chart.svelte";
  export let dataSets;
  export let chartOpts = {
    selectedChartType: 'column',
    selectedDataSet: []
  };
</script>

<div>
  <label for="chartType"> Chart type </label>
  <select id="chartType" bind:value={chartOpts.selectedChartType} on:change={() => {}}>
    <option value={"column"} selected>
      {"Column"}
    </option>
    <option value={"bar"}>
      {"Bar"}
    </option>
    <option value={"pie"}>
      {"Pie"}
    </option>
  </select>

  <label for="dataSet"> Select data set </label>
  <select id="dataSet" bind:value={chartOpts.selectedDataSet} on:change={() => {}}>
    <option value={dataSets[0]}>
      {"Data Set 1"}
    </option>
    <option value={dataSets[1]}>
      {"Data Set 2"}
    </option>
  </select>
</div>

<style>
  div {
    display: flex;
    align-items: center;
    justify-content: center;
    align-self: flex-start;
  }

  label {
    padding: 10px;
  }

  select {
    padding: 10px;
  }
</style>
