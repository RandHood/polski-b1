interface Option { id: string; label: string }

/** Segmented toggle: thick olive outline, selected option filled. */
export function Toggle({ options, value, onChange, label, wide }: {
  options: Option[]; value: string; onChange: (id: string) => void; label: string; wide?: boolean;
}) {
  return (
    <div class={`toggle${wide ? ' toggle--wide' : ''}`} role="tablist" aria-label={label}>
      {options.map((o) => (
        <button key={o.id} type="button" role="tab" aria-selected={o.id === value}
          class={o.id === value ? 'is-on' : ''} onClick={() => onChange(o.id)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
