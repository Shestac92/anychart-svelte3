<script>
	import Chart from './Chart.svelte';
	import Controls from './Controls.svelte';
	import cosmeticksData from '../public/data/cosmetics.json';
	import pancakeFillingsData from '../public/data/pancake-fillings.json';

	const dataSets = [cosmeticksData, pancakeFillingsData];

	// declare chart component props with default values
	let chartOpts = {
		selectedChartType: 'column',
    selectedDataSet: dataSets[0]
	};
</script>

<main>
	<h1>Svelte - AnyChart integration demo</h1>

	<p>To learn more about building charts visit <a href='https://docs.anychart.com/Quick_Start/Quick_Start'>the AnyChart Documentation</a>.</p>
	<p>You can find all products by AnyChart on <a href='https://anychart.com/'>the official official website</a>.</p>
	<p>Visit the <a href="https://svelte.dev/tutorial">Svelte tutorial</a> to learn how to build Svelte apps.</p>

	<Controls {dataSets} bind:chartOpts={chartOpts}></Controls>
	<Chart type={chartOpts.selectedChartType} data={chartOpts.selectedDataSet}></Chart>
</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		height: 90%;
		margin: 0 auto;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 400;
	}

	p {
		font-weight: 600;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>
