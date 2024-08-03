import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CourseService } from '../course.service';


@Component({
  selector: 'app-alert-dialog',
  templateUrl: './alert-dialog.component.html',
  styleUrls: ['./alert-dialog.component.css']
})
export class AlertDialogComponent implements OnInit {

    constructor(private dialogRef: MatDialogRef<AlertDialogComponent>, @Inject(MAT_DIALOG_DATA) public data: any, private courseService: CourseService) { }

  ngOnInit(): void {
  }

  close() {
    this.dialogRef.close({event: 'Cancel'});
  }

  onDelete() {
    this.courseService.deleteCourse(this.data).subscribe((resp) => {
      if(resp.success === true) {
        this.dialogRef.close({event: 'Delete Succesfull', data: resp});
      } else if (resp.status === 404) {
        this.dialogRef.close({event: 'Delete Error', data: resp});
      }
    },
  error => {
    this.dialogRef.close({event: 'Delete Error', data: error});
  });
  }
}
