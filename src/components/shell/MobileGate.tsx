"use client";

export function MobileGateScreen() {
  return (
    <main className="gate-screen">
      <article className="card gate-card">
        <div className="band-pad">
          <p className="label opacity-55">00 / Gate</p>
        </div>
        <div className="band-pad">
          <h1 className="display uppercase">Domirush</h1>
          <p className="kicker mt-4">
            The mobile version is currently in development. Play on a laptop, desktop, or tablet
            in landscape.
          </p>
        </div>
      </article>
    </main>
  );
}
