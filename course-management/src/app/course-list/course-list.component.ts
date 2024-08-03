import { Component, OnInit, ViewChild } from '@angular/core';
import { CourseService } from '../course.service';
import { CourseFormComponent } from '../course-form/course-form.component';
import { MatDialog } from '@angular/material/dialog';
import { AlertDialogComponent } from '../alert-dialog/alert-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CurrencyPipe } from '@angular/common';

@Component({
  selector: 'app-course-list',
  templateUrl: './course-list.component.html',
  styleUrls: ['./course-list.component.css'],
  providers: [CurrencyPipe],
})
export class CourseListComponent implements OnInit {
  courses: any[] = [];
  totalCourses: number = 0;
  page: number = 1;
  perPage: number = 10;
  searchParams: any = {};
  searchTerm: string = '';

  constructor(private courseService: CourseService, private dialog: MatDialog, private _snackbar: MatSnackBar, private currencyPipe: CurrencyPipe) {}

  ngOnInit(): void {
    this.loadCourses();
  }

  loadCourses(): void {
    this.courseService.getCourses(this.page, this.perPage, this.searchParams).subscribe(response => {
      this.courses = response.courses;
      this.totalCourses = response.total;
    });
  }

  formatCurrency(price: string, currecnySymbol: string): string | null {
    return this.currencyPipe.transform(price, currecnySymbol, 'symbol-narrow', '1.0-2');
  } 

  onSearch(): void {
    this.searchParams = {search: this.searchTerm};
    this.page = 1;
    this.loadCourses();
  }

  onPageChange(event: any): void {
    this.page = event.pageIndex + 1;
    this.perPage = event.pageSize;
    this.loadCourses();
  }

  onDelete(courseId: string): void {
    const dialogRef = this.dialog.open(AlertDialogComponent, {
      data: courseId
    })
    dialogRef.afterClosed().subscribe(result => {
      if (result.event === 'Delete Succesfull') {
        this._snackbar.open(result.data.message, 'Close', {duration: 2000});
        this.loadCourses();
      } else if ( result.event === 'Delete Error') {
        this._snackbar.open(result.data.error.error, 'close', {duration: 5000});
      }
    });
  }

  onEdit(course: any): void {
    const dialogRef = this.dialog.open(CourseFormComponent, {
      width: '400px',
      data: course
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result.event === 'updated') {
        this.loadCourses();
      }
    });
  }
  calculateCourseLength(startDate: string, endDate: string): number {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    const differenceInTime = end - start;
    const differenceInDays = differenceInTime / (1000 * 3600 * 24);
    return differenceInDays;
  }

  onCreate(): void {
    const dialogRef = this.dialog.open(CourseFormComponent, {
      width: '400px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result.event === 'created') {
        this.loadCourses();
      }
    });
  }
}
