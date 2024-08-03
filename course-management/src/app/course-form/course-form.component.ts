import { Component, OnInit, Inject, Optional } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideNativeDateAdapter } from '@angular/material/core';
import { CourseService } from '../course.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, of } from 'rxjs';
import { map, startWith, switchMap } from 'rxjs/operators';
import { CurrencyPipe, DatePipe } from '@angular/common';

@Component({
  selector: 'app-course-form',
  templateUrl: './course-form.component.html',
  styleUrls: ['./course-form.component.css'],
  providers: [provideNativeDateAdapter(), CurrencyPipe, DatePipe],
})
export class CourseFormComponent implements OnInit {
  courseForm: UntypedFormGroup;
  universities$: Observable<string[]>;
  countries$: Observable<string[]>;
  cities$: Observable<string[]>;
  currencies$: Observable<string[]>;

  filteredUniversities$: Observable<string[]> = of([]);
  filteredCountries$: Observable<string[]> = of([]);
  filteredCities$: Observable<string[]> = of([]);

  isEditMode: boolean = false;

  constructor(
    private fb: UntypedFormBuilder,
    private courseFormService: CourseService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<CourseFormComponent>,
    private currencyPipe: CurrencyPipe,
    private datePipe: DatePipe,
    @Optional() @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.universities$ = this.courseFormService.getUniversities();
    this.countries$ = this.courseFormService.getCountries();
    this.cities$ = this.courseFormService.getCities();
    this.currencies$ = this.courseFormService.getCurrencies();
    this.courseForm = this.fb.group({
      CourseName: [{ value: '', disabled: this.isEditMode }, Validators.required],
      University: [{ value: '', disabled: this.isEditMode }, Validators.required],
      Country: [{ value: '', disabled: this.isEditMode }, Validators.required],
      City: [{ value: '', disabled: this.isEditMode }, Validators.required],
      Currency: [{value: ''}, Validators.required],
      Price: ['', [Validators.required, Validators.min(0)]],
      StartDate: ['', Validators.required],
      EndDate: ['', Validators.required],
      CourseDescription: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    if (this.data) {
      this.isEditMode = true;
      this.courseForm = this.fb.group({
        CourseName: [{ value: '', disabled: this.isEditMode }, Validators.required],
        University: [{ value: '', disabled: this.isEditMode }, Validators.required],
        Country: [{ value: '', disabled: this.isEditMode }, Validators.required],
        City: [{ value: '', disabled: this.isEditMode }, Validators.required],
        Currency: [{value: ''}, Validators.required],
        Price: ['', [Validators.required, Validators.min(0)]],
        StartDate: ['', Validators.required],
        EndDate: ['', Validators.required],
        CourseDescription: ['', Validators.required]
      });
      this.courseForm.patchValue(this.data);
    }
    
    this.loadData();
  }
  private loadData(): void {
    // Refresh observables if needed
    this.universities$.subscribe();
    this.countries$.subscribe();
    this.cities$.subscribe();

    this.filteredUniversities$ = this.courseForm.get('University')!.valueChanges.pipe(
      startWith(''),
      switchMap(value => this.universities$.pipe(
        map(options => this._filter(value, options)))
      )
    );

    this.filteredCountries$ = this.courseForm.get('Country')!.valueChanges.pipe(
      startWith(''),
      switchMap(value => this.countries$.pipe(
        map(options => this._filter(value, options)))
      )
    );

    this.filteredCities$ = this.courseForm.get('City')!.valueChanges.pipe(
      startWith(''),
      switchMap(value => this.cities$.pipe(
        map(options => this._filter(value, options)))
      )
    );
  }

  private _filter(value: string, options: string[]): string[] {
    const filterValue = value.toLowerCase();
    return  options.filter(option => option.toLowerCase().includes(filterValue));
  }

  closeDialog() {
    this.dialogRef.close();
  }

  formatCurrency(code: string) {
    const formatted = this.currencyPipe.transform(0, code, 'symbol-narrow');
    if (formatted) {
      const symbolMatch = formatted.match(/[^\d\s]+/);
      return symbolMatch ? symbolMatch[0] : code;
    }
    return code;
  }

  onSubmit(): void {
    if (this.courseForm.valid) {
      const course = this.courseForm.value;
      // Format dates to only include date part (YYYY-MM-DD)
      course.StartDate = this.datePipe.transform(course.StartDate, 'yyyy-MM-dd');
      course.EndDate = this.datePipe.transform(course.EndDate, 'yyyy-MM-dd');
      if (this.isEditMode) {
        this.courseFormService.updateCourse(this.data._id, course).subscribe(
          () => {
            this.snackBar.open('Course updated successfully', 'Close', { duration: 2000 });
            this.dialogRef.close({event: 'updated'});
          },
          error => this.snackBar.open(error, 'Close', { duration: 5000 })
        );
      } else {
        this.courseFormService.createCourse(course).subscribe(
          response => {
            this.snackBar.open('Course created successfully', 'Close', { duration: 2000 });
            this.dialogRef.close({event: 'created'});
          },
          error => this.snackBar.open(error, 'Close', { duration: 5000 })
        );
      }
    }
  }
}
