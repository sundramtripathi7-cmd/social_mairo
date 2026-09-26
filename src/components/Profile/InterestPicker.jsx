import {
  INTERESTS,
  MAX_INTERESTS,
} from "../../constants/interests";

function InterestPicker({
  selected,
  onChange,
  disabled,
}) {
  function toggle(id) {
    if (disabled) {
      return;
    }

    if (selected.includes(id)) {
      onChange(selected.filter((item) => item !== id));
      return;
    }

    if (selected.length >= MAX_INTERESTS) {
      return;
    }

    onChange([...selected, id]);
  }

  return (
    <div className="interest-picker">
      <div className="interest-chips">
        {INTERESTS.map((interest) => {
          const active = selected.includes(interest.id);
          const locked =
            !active && selected.length >= MAX_INTERESTS;

          return (
            <button
              key={interest.id}
              type="button"
              className={`interest-chip ${
                active ? "active" : ""
              }`}
              aria-pressed={active}
              disabled={disabled || locked}
              onClick={() => toggle(interest.id)}
            >
              {interest.label}
            </button>
          );
        })}
      </div>

      <p className="interest-count">
        {selected.length} of {MAX_INTERESTS} selected
      </p>
    </div>
  );
}

export default InterestPicker;
