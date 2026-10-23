import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

/**
 * Automation Code For Test Cases In This App App
 *
 * TODO: Implement the automation code for test cases in this app here.
 * This is a starter scaffold — customize the state, template, and logic below.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="card">
        <h1>Automation Code For Test Cases In This App</h1>
        <p class="subtitle">Your automation code for test cases in this app starts here</p>

        <div class="placeholder">
          <p>👋 Welcome! This is a custom Angular app scaffold for <b>automation code for test cases in this app</b>.</p>
          <p>Edit <code>src/app/app.component.ts</code> to build your app.</p>
        </div>

        <div class="demo">
          <div class="counter">
            <button (click)="decrement()">−</button>
            <span>{{ count() }}</span>
            <button (click)="increment()">+</button>
          </div>
          <p class="hint">Example state (replace with your logic)</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px; }
    .card { background:rgba(255,255,255,0.04);backdrop-filter:blur(20px);border:1px solid rgba(255,255,255,0.1);border-radius:24px;padding:48px;max-width:520px;width:100%;text-align:center; }
    h1 { color:#fff;font-size:36px;margin:0 0 8px; }
    .subtitle { color:rgba(255,255,255,0.5);font-size:15px;margin:0 0 32px; }
    .placeholder { background:rgba(129,140,248,0.08);border:1px dashed rgba(129,140,248,0.25);border-radius:12px;padding:24px;margin-bottom:24px;text-align:left; }
    .placeholder p { color:rgba(255,255,255,0.8);font-size:14px;line-height:1.6;margin:0 0 8px; }
    .placeholder p:last-child { margin:0;color:rgba(255,255,255,0.5); }
    .placeholder code { background:rgba(0,0,0,0.3);color:#a5b4fc;padding:2px 8px;border-radius:4px;font-family:'JetBrains Mono',monospace;font-size:13px; }
    .demo { padding-top:24px;border-top:1px solid rgba(255,255,255,0.08); }
    .counter { display:flex;align-items:center;justify-content:center;gap:20px;margin-bottom:8px; }
    .counter button { width:48px;height:48px;border-radius:50%;border:none;background:rgba(255,255,255,0.08);color:#fff;font-size:24px;cursor:pointer;transition:all 0.15s; }
    .counter button:hover { background:rgba(129,140,248,0.2); }
    .counter span { font-size:32px;font-weight:700;color:#fff;min-width:60px;font-variant-numeric:tabular-nums; }
    .hint { color:rgba(255,255,255,0.3);font-size:12px;font-style:italic;margin:0; }
  `]
})
export class AppComponent {
  count = signal(0);

  increment() { this.count.update(n => n + 1); }
  decrement() { this.count.update(n => n - 1); }
}