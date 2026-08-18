<!-- Decorative brand mark — a rounded three-stripe rectangle echoing the
     Armenian flag, muted to sit inside the warm palette (the accent token
     stands in for the flag's own orange). Always paired with a real
     translated wordmark/heading next to it, per Conventions #1 — it is
     aria-hidden and carries no meaning on its own. -->
<span class="flagmark" aria-hidden="true">
	<span class="stripe r"></span>
	<span class="stripe b"></span>
	<span class="stripe o"></span>
</span>

<style>
	.flagmark {
		display: flex;
		flex-direction: column;
		width: 1.6rem;
		height: 1.25rem;
		border-radius: var(--radius-sm);
		overflow: hidden;
		box-shadow: var(--shadow-sm);
		flex-shrink: 0;
	}

	.stripe {
		flex: 1;
	}

	.r {
		background: #b5504a;
	}

	.b {
		background: #5b6f96;
	}

	.o {
		background: var(--color-primary);
	}
</style>
