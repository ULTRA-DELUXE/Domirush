"use client";

export function ViewportGateScreen() {
  return (
    <main className="gate-screen">
      <article className="card gate-card">
        <div className="band-pad">
          <p className="label opacity-55">00 / Gate</p>
        </div>
        <div className="band-pad">
          <h1 className="display uppercase">Bigger Screen, Please</h1>
          <p className="kicker mt-4">
            Widen this window, or give it more height, until the board can sit in view without
            scrolling.
          </p>
        </div>
      </article>
    </main>
  );
}
