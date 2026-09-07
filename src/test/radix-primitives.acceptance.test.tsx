import { useState } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';

import { QuoteCheckbox } from '@/components/quote-builder/redesign/QuoteCheckbox';
import { QuoteRadioTile } from '@/components/quote-builder/redesign/QuoteRadioTile';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

function MotorFamilySelect({ onValueChange }: { onValueChange?: (value: string) => void }) {
  const [value, setValue] = useState('');

  return (
    <Select
      value={value}
      onValueChange={(nextValue) => {
        setValue(nextValue);
        onValueChange?.(nextValue);
      }}
    >
      <SelectTrigger aria-label="Motor family">
        <SelectValue placeholder="Select family" />
      </SelectTrigger>
      <SelectContent position="item-aligned">
        <SelectItem value="fourstroke">FourStroke</SelectItem>
        <SelectItem value="verado">Verado</SelectItem>
      </SelectContent>
    </Select>
  );
}

function SelectFormHarness() {
  const { register, setValue, watch } = useForm({ defaultValues: { family: '' } });
  const family = watch('family');

  return (
    <form>
      <Select
        {...register('family')}
        value={family}
        onValueChange={(value) => setValue('family', value, { shouldValidate: true })}
      >
        <SelectTrigger aria-label="Form motor family">
          <SelectValue placeholder="Select family" />
        </SelectTrigger>
        <SelectContent position="item-aligned">
          <SelectItem value="fourstroke">FourStroke</SelectItem>
          <SelectItem value="verado">Verado</SelectItem>
        </SelectContent>
      </Select>
      <output aria-label="Selected family">{family || 'none'}</output>
    </form>
  );
}

function CheckboxFormHarness() {
  const { register, setValue, watch } = useForm({
    defaultValues: { includeRigging: false },
  });
  const includeRigging = watch('includeRigging');

  return (
    <form>
      <Checkbox
        {...register('includeRigging')}
        checked={includeRigging}
        onCheckedChange={(checked) =>
          setValue('includeRigging', checked === true, { shouldValidate: true })
        }
        aria-label="Include rigging"
      />
      <output aria-label="Rigging state">{String(includeRigging)}</output>
    </form>
  );
}

function NestedQuoteCheckboxTile() {
  const [selected, setSelected] = useState(false);
  const [toggleCount, setToggleCount] = useState(0);

  const toggle = () => {
    setToggleCount((count) => count + 1);
    setSelected((value) => !value);
  };

  return (
    <>
      <QuoteRadioTile
        multi
        selected={selected}
        onClick={toggle}
        icon={
          <QuoteCheckbox
            checked={selected}
            onCheckedChange={toggle}
            onClick={(event) => event.stopPropagation()}
            aria-label="Include stainless propeller"
          />
        }
        label="Stainless propeller"
      />
      <output aria-label="Quote option state">{selected ? 'selected' : 'not selected'}</output>
      <output aria-label="Quote option toggle count">{toggleCount}</output>
    </>
  );
}

function ShaftAccordion() {
  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="shaft">
        <AccordionTrigger>Shaft length</AccordionTrigger>
        <AccordionContent>Measure from the transom top.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="controls">
        <AccordionTrigger>Controls</AccordionTrigger>
        <AccordionContent>Side mount or binnacle.</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function HorsepowerSlider({ onValueChange }: { onValueChange: (value: number[]) => void }) {
  const [value, setValue] = useState([25]);

  return (
    <>
      <Slider
        min={0}
        max={100}
        step={5}
        value={value}
        onValueChange={(nextValue) => {
          setValue(nextValue);
          onValueChange(nextValue);
        }}
      />
      <output aria-label="Horsepower value">{value[0]}</output>
    </>
  );
}

async function chooseSelectOption(triggerName: string, optionName: string) {
  const trigger = screen.getByRole('combobox', { name: triggerName });
  fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false, pointerType: 'mouse' });
  fireEvent.click(await screen.findByRole('option', { name: optionName }));
}

function activateNativeButtonWithKeyboard(element: HTMLElement, key: 'Enter' | ' ') {
  element.focus();
  fireEvent.keyDown(element, { key });
  if (key === ' ') {
    fireEvent.keyUp(element, { key });
  }
  fireEvent.click(element);
}

describe('Radix primitive upgrade acceptance', () => {
  it('opens an item-aligned Select and commits the chosen value', async () => {
    const onValueChange = vi.fn();
    render(<MotorFamilySelect onValueChange={onValueChange} />);

    await chooseSelectOption('Motor family', 'Verado');

    await waitFor(() => {
      expect(onValueChange).toHaveBeenCalledTimes(1);
      expect(onValueChange).toHaveBeenCalledWith('verado');
      expect(screen.getByRole('combobox', { name: 'Motor family' })).toHaveTextContent('Verado');
    });
  });

  it('keeps a register()+setValue Select value in react-hook-form state', async () => {
    render(<SelectFormHarness />);

    expect(screen.getByRole('status', { name: 'Selected family' })).toHaveTextContent('none');
    await chooseSelectOption('Form motor family', 'FourStroke');

    await waitFor(() => {
      expect(screen.getByRole('status', { name: 'Selected family' })).toHaveTextContent(
        'fourstroke',
      );
      expect(screen.getByRole('combobox', { name: 'Form motor family' })).toHaveTextContent(
        'FourStroke',
      );
    });
  });

  it('keeps register()+setValue Checkbox state without double-toggling', async () => {
    render(<CheckboxFormHarness />);

    const checkbox = screen.getByRole('checkbox', { name: 'Include rigging' });
    expect(screen.getByRole('status', { name: 'Rigging state' })).toHaveTextContent('false');

    fireEvent.click(checkbox);
    await waitFor(() => {
      expect(checkbox).toHaveAttribute('aria-checked', 'true');
      expect(screen.getByRole('status', { name: 'Rigging state' })).toHaveTextContent('true');
    });

    fireEvent.click(checkbox);
    await waitFor(() => {
      expect(checkbox).toHaveAttribute('aria-checked', 'false');
      expect(screen.getByRole('status', { name: 'Rigging state' })).toHaveTextContent('false');
    });
  });

  it('toggles nested QuoteCheckbox once and QuoteRadioTile once', () => {
    render(<NestedQuoteCheckboxTile />);

    fireEvent.click(screen.getByRole('checkbox', { name: 'Include stainless propeller' }));
    expect(screen.getByRole('status', { name: 'Quote option toggle count' })).toHaveTextContent(
      '1',
    );
    expect(screen.getByRole('status', { name: 'Quote option state' })).toHaveTextContent(
      'selected',
    );

    const tile = screen.getByText('Stainless propeller').closest('[role="checkbox"]');
    expect(tile).not.toBeNull();
    fireEvent.keyDown(tile as HTMLElement, { key: 'Enter' });
    expect(screen.getByRole('status', { name: 'Quote option toggle count' })).toHaveTextContent(
      '2',
    );
    expect(screen.getByRole('status', { name: 'Quote option state' })).toHaveTextContent(
      'not selected',
    );
  });

  it('closes Dialog on Escape and restores focus to the trigger', async () => {
    render(
      <Dialog>
        <DialogTrigger>Open quote notes</DialogTrigger>
        <DialogContent>
          <DialogTitle>Quote notes</DialogTitle>
          <DialogDescription>Notes stay on this quote.</DialogDescription>
        </DialogContent>
      </Dialog>,
    );

    const trigger = screen.getByRole('button', { name: 'Open quote notes' });
    trigger.focus();
    fireEvent.click(trigger);
    expect(screen.getByRole('dialog', { name: 'Quote notes' })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('keeps Accordion activation and roving focus keyboard-safe', () => {
    render(<ShaftAccordion />);

    const shaft = screen.getByRole('button', { name: 'Shaft length' });
    const controls = screen.getByRole('button', { name: 'Controls' });
    expect(shaft.tagName).toBe('BUTTON');

    activateNativeButtonWithKeyboard(shaft, 'Enter');
    expect(shaft).toHaveAttribute('aria-expanded', 'true');
    activateNativeButtonWithKeyboard(shaft, ' ');
    expect(shaft).toHaveAttribute('aria-expanded', 'false');

    shaft.focus();
    fireEvent.keyDown(shaft, { key: 'ArrowDown' });
    expect(controls).toHaveFocus();
  });

  it('preserves href and one handler call when Button renders a link asChild', () => {
    const handleClick = vi.fn();
    render(
      <Button asChild onClick={handleClick}>
        <a href="/quote/motor-selection" onClick={(event) => event.preventDefault()}>
          Build my quote
        </a>
      </Button>,
    );

    const link = screen.getByRole('link', { name: 'Build my quote' });
    expect(link).toHaveAttribute('href', '/quote/motor-selection');
    expect(link.tagName).toBe('A');
    fireEvent.click(link);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('updates a single-value Slider from the keyboard', () => {
    const onValueChange = vi.fn();
    render(<HorsepowerSlider onValueChange={onValueChange} />);

    const thumb = screen.getByRole('slider');
    thumb.focus();
    fireEvent.keyDown(thumb, { key: 'ArrowRight' });

    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith([30]);
    expect(thumb).toHaveAttribute('aria-valuenow', '30');
    expect(screen.getByRole('status', { name: 'Horsepower value' })).toHaveTextContent('30');
  });
});
